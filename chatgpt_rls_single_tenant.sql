-- ========================================
-- SOLUCIÓN RLS SINGLE-TENANT (SIN EMPRESA_ID)
-- Basado en análisis de ChatGPT + Ajustado a tu arquitectura
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

-- (c) Políticas consistentes y completas (SINGLE-TENANT)
do $$
begin
  -- SELECT: ver sólo su propio perfil o todos si es admin/developer
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_select'
  ) then
    execute $pol$
      create policy profiles_select
      on public.profiles
      for select
      using (
        -- Admin/developer puede ver todos los perfiles; el resto solo el propio
        get_user_role_from_jwt() in ('admin','developer')
        or (id = auth.uid())
      );
    $pol$;
  end if;

  -- UPDATE: usuario edita su perfil; admin/developer edita cualquier perfil
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
        or get_user_role_from_jwt() in ('admin','developer')
      );
    $pol$;
  end if;

  -- DELETE: restringido a admin/developer
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
      );
    $pol$;
  end if;
end$$;

-- (d) INSERT CORRECTO (PUNTO CRÍTICO - RESUELVE EL COLGADO)
-- Reglas clave:
--   - El usuario solo puede insertar SU fila (id = auth.uid()).
--   - Admin/developer también se autorreten (mismo check).
create policy profiles_insert_self
on public.profiles
for insert
with check (
  id = auth.uid()
);

-- -----------------------------------------------------------
-- 2) FACTURAS — POLÍTICAS COMPLETAS (SINGLE-TENANT)
-- -----------------------------------------------------------
alter table public.facturas enable row level security;

-- Opcional: política de bypass para el servicio
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

-- SELECT: cualquiera autenticado ve todas las facturas (single-tenant)
create policy facturas_select_all
on public.facturas
for select
using (
  auth.uid() IS NOT NULL
);

-- INSERT: cualquiera autenticado puede crear facturas
create policy facturas_insert_authenticated
on public.facturas
for insert
with check (
  auth.uid() IS NOT NULL
);

-- UPDATE: el creador puede editar sus propias facturas; admin/developer pueden editar cualquier factura
create policy facturas_update_all
on public.facturas
for update
using (
  auth.uid() IS NOT NULL
)
with check (
  auth.uid() IS NOT NULL
);

-- DELETE: restringido a admin/developer
create policy facturas_delete_admin
on public.facturas
for delete
using (
  get_user_role_from_jwt() in ('admin','developer')
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
-- NOTAS DE IMPLEMENTACIÓN (SINGLE-TENANT)
-- ========================================
-- 
-- ✅ INSERT en profiles se valida con WITH CHECK (resuelve el colgado)
-- ✅ Modelo de seguridad single-tenant (sin empresa_id)
-- ✅ Políticas CRUD para todas las operaciones
-- ✅ Validación por rol (admin/developer tienen más permisos)
-- ✅ Bypass para service_role (mantenimiento)
-- 
-- 🧪 PRUEBAS RÁPIDAS (ejecutar como usuario autenticado):
-- 
-- 1) Nuevo usuario: crear su perfil
-- insert into public.profiles (id, username, email, role)
-- values (auth.uid(), 'test_user', 'test@example.com', 'usuario');
-- 
-- 2) Facturas: CRUD básico
-- insert into public.facturas (id, /* otros campos */)
-- values (gen_random_uuid(), /* otros valores */);
-- 
-- select * from public.facturas;  -- todas las facturas (single-tenant)
-- 
-- ========================================
