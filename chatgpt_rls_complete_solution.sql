-- ========================================
-- SOLUCIÓN COMPLETA RLS - MODELO EMPRESARIAL
-- Basado en análisis de ChatGPT + Cross-check
-- ========================================
-- Ejecutar en Supabase SQL Editor

begin;

-- -----------------------------------------------------------
-- 0) PERMISOS BASE Y SEGURIDAD
-- -----------------------------------------------------------
-- Quita grants peligrosos y asegura que solo "authenticated" usa estas tablas
revoke all on table public.profiles  from anon;
revoke all on table public.facturas  from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.facturas to authenticated;

-- -----------------------------------------------------------
-- 1) PROFILES — REPARAR INSERT (PROBLEMA PRINCIPAL)
-- -----------------------------------------------------------
-- (a) Habilitar RLS (idempotente)
alter table public.profiles enable row level security;

-- (b) Eliminar política rota (si existe)
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'profiles_insert_authenticated'
  ) then
    execute 'drop policy "profiles_insert_authenticated" on public.profiles';
  end if;
end$$;

-- (c) Políticas consistentes y completas
do $$
begin
  -- SELECT: ver sólo su propio perfil o de su empresa si rol lo permite
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_select'
  ) then
    execute $pol$
      create policy profiles_select
      on public.profiles
      for select
      using (
        -- Admin/manager puede ver perfiles de su empresa; el resto solo el propio
        (get_user_role_from_jwt() in ('admin','developer') and empresa_id = get_user_empresa_from_jwt())
        or (id = auth.uid())
      );
    $pol$;
  end if;

  -- UPDATE: usuario edita su perfil; admin/developer edita perfiles de su empresa
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_update'
  ) then
    execute $pol$
      create policy profiles_update
      on public.profiles
      for update
      using (
        (id = auth.uid())
        or (get_user_role_from_jwt() in ('admin','developer') and empresa_id = get_user_empresa_from_jwt())
      )
      with check (
        -- Evita escalar empresa/propiedad fuera de su ámbito
        empresa_id = get_user_empresa_from_jwt()
      );
    $pol$;
  end if;

  -- DELETE: restringido a admin/developer de la misma empresa
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_delete'
  ) then
    execute $pol$
      create policy profiles_delete
      on public.profiles
      for delete
      using (
        get_user_role_from_jwt() in ('admin','developer')
        and empresa_id = get_user_empresa_from_jwt()
      );
    $pol$;
  end if;
end$$;

-- (d) INSERT CORRECTO (PUNTO CRÍTICO - RESUELVE EL COLGADO)
-- Reglas clave:
--   - El usuario solo puede insertar SU fila (id = auth.uid()).
--   - La fila debe pertenecer a su empresa JWT.
--   - Admin/developer también se autorreten (mismo check).
create policy profiles_insert_self
on public.profiles
for insert
with check (
  id = auth.uid()
  and empresa_id = get_user_empresa_from_jwt()
);

-- -----------------------------------------------------------
-- 2) FACTURAS — POLÍTICAS COMPLETAS
-- -----------------------------------------------------------
alter table public.facturas enable row level security;

-- Opcional: política de bypass para el servicio (supabase service role usa jwt con role=service_role)
-- Esto NO afecta a "authenticated".
create policy facturas_service_bypass
on public.facturas
as permissive
for all
to public
using (
  current_setting('request.jwt.claims', true)::jsonb ? 'role'
  and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
)
with check (
  current_setting('request.jwt.claims', true)::jsonb ? 'role'
  and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- SELECT: cualquiera autenticado ve sólo facturas de su empresa
create policy facturas_select_empresa
on public.facturas
for select
using (
  empresa_id = get_user_empresa_from_jwt()
);

-- INSERT: sólo dentro de su empresa; created_by debe coincidir
create policy facturas_insert_empresa
on public.facturas
for insert
with check (
  empresa_id = get_user_empresa_from_jwt()
  and created_by = auth.uid()
);

-- UPDATE: el creador puede editar sus propias facturas; admin/developer pueden editar cualquier factura de su empresa
create policy facturas_update_empresa
on public.facturas
for update
using (
  empresa_id = get_user_empresa_from_jwt()
  and (
    created_by = auth.uid()
    or get_user_role_from_jwt() in ('admin','developer')
  )
)
with check (
  empresa_id = get_user_empresa_from_jwt()
);

-- DELETE: restringido a admin/developer de la misma empresa
create policy facturas_delete_empresa
on public.facturas
for delete
using (
  empresa_id = get_user_empresa_from_jwt()
  and get_user_role_from_jwt() in ('admin','developer')
);

-- -----------------------------------------------------------
-- 3) VERIFICACIÓN FINAL
-- -----------------------------------------------------------
-- Verificar políticas creadas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename, policyname;

-- Verificar estado RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'facturas')
ORDER BY tablename;

commit;

-- ========================================
-- NOTAS DE IMPLEMENTACIÓN
-- ========================================
-- 
-- ✅ INSERT en profiles se valida con WITH CHECK (resuelve el colgado)
-- ✅ Modelo de seguridad empresarial completo
-- ✅ Políticas CRUD para todas las operaciones
-- ✅ Validación de empresa_id en todas las políticas
-- ✅ Bypass para service_role (mantenimiento)
-- 
-- 🧪 PRUEBAS RÁPIDAS (ejecutar como usuario autenticado):
-- 
-- 1) Nuevo usuario: crear su perfil
-- insert into public.profiles (id, empresa_id, role)
-- values (auth.uid(), get_user_empresa_from_jwt(), 'usuario');
-- 
-- 2) Facturas: CRUD básico
-- insert into public.facturas (id, empresa_id, created_by)
-- values (gen_random_uuid(), get_user_empresa_from_jwt(), auth.uid());
-- 
-- select * from public.facturas;  -- sólo de tu empresa
-- 
-- ========================================
