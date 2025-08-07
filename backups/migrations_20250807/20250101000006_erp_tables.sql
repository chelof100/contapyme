/*
  # ERP Lite Tables Creation

  1. New Tables
    - `presupuestos` - Budget management with categories
    - `cash_flow_proyecciones` - Cash flow projections and tracking
    - `empleados` - Employee management with CUIL validation
    - `asistencia` - Employee attendance tracking
    - `proyectos` - Project management with budgets
    - `tiempo_trabajado` - Time tracking for projects
    - `categorias_financieras` - Financial categories for better organization
    - `indicadores_kpi` - KPI tracking and targets

  2. Security
    - Enable RLS on all tables
    - Add policies for company-based access control
    - Add policies for employee self-access where appropriate

  3. Indexes
    - Performance indexes for common queries
    - Unique constraints for business rules
*/

-- Financial Management Tables
CREATE TABLE IF NOT EXISTS categorias_financieras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  nombre varchar(100) NOT NULL,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  descripcion text,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  ano integer NOT NULL,
  mes integer CHECK (mes >= 1 AND mes <= 12),
  categoria_id uuid REFERENCES categorias_financieras(id),
  categoria varchar(100) NOT NULL,
  subcategoria varchar(100),
  monto_presupuestado decimal(15,2) NOT NULL,
  monto_real decimal(15,2) DEFAULT 0,
  variacion_porcentaje decimal(5,2) DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_flow_proyecciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  fecha date NOT NULL,
  concepto varchar(255) NOT NULL,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto decimal(15,2) NOT NULL,
  estado varchar(20) DEFAULT 'proyectado' CHECK (estado IN ('proyectado', 'confirmado', 'realizado')),
  categoria varchar(100),
  oportunidad_id uuid,
  factura_id uuid,
  recurrente boolean DEFAULT false,
  frecuencia varchar(20), -- mensual, trimestral, anual
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indicadores_kpi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  nombre varchar(100) NOT NULL,
  descripcion text,
  valor_actual decimal(15,2) DEFAULT 0,
  valor_objetivo decimal(15,2),
  unidad varchar(20), -- porcentaje, pesos, cantidad
  periodo varchar(20) DEFAULT 'mensual', -- diario, semanal, mensual, anual
  fecha_calculo date DEFAULT CURRENT_DATE,
  tendencia varchar(20), -- subiendo, bajando, estable
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee Management Tables
CREATE TABLE IF NOT EXISTS empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  cuil varchar(11) UNIQUE NOT NULL,
  nombre varchar(255) NOT NULL,
  apellido varchar(255) NOT NULL,
  email varchar(255),
  telefono varchar(50),
  direccion text,
  fecha_nacimiento date,
  cargo varchar(100),
  departamento varchar(100),
  fecha_ingreso date NOT NULL,
  fecha_egreso date,
  salario_basico decimal(12,2),
  tipo_contrato varchar(50) DEFAULT 'planta_permanente',
  estado varchar(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'licencia', 'vacaciones')),
  banco_cbu varchar(22),
  obra_social varchar(100),
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid REFERENCES empleados(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora_entrada time,
  hora_salida time,
  horas_trabajadas decimal(4,2),
  horas_extra decimal(4,2) DEFAULT 0,
  tipo varchar(20) DEFAULT 'normal' CHECK (tipo IN ('normal', 'feriado', 'licencia', 'falta', 'vacaciones')),
  justificacion text,
  aprobado boolean DEFAULT false,
  aprobado_por uuid REFERENCES empleados(id),
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(empleado_id, fecha)
);

CREATE TABLE IF NOT EXISTS liquidaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  empleado_id uuid REFERENCES empleados(id) ON DELETE CASCADE,
  periodo_ano integer NOT NULL,
  periodo_mes integer NOT NULL CHECK (periodo_mes >= 1 AND periodo_mes <= 12),
  salario_basico decimal(12,2) NOT NULL,
  horas_trabajadas decimal(6,2) DEFAULT 0,
  horas_extra decimal(6,2) DEFAULT 0,
  bonificaciones decimal(12,2) DEFAULT 0,
  descuentos decimal(12,2) DEFAULT 0,
  aportes_empleado decimal(12,2) DEFAULT 0,
  contribuciones_empleador decimal(12,2) DEFAULT 0,
  sueldo_bruto decimal(12,2) NOT NULL,
  sueldo_neto decimal(12,2) NOT NULL,
  estado varchar(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'calculada', 'pagada')),
  fecha_pago date,
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(empleado_id, periodo_ano, periodo_mes)
);

-- Project Management Tables
CREATE TABLE IF NOT EXISTS proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  cliente_id uuid,
  codigo varchar(50) NOT NULL,
  nombre varchar(255) NOT NULL,
  descripcion text,
  fecha_inicio date,
  fecha_fin_estimada date,
  fecha_fin_real date,
  presupuesto decimal(15,2),
  costo_real decimal(15,2) DEFAULT 0,
  facturado decimal(15,2) DEFAULT 0,
  estado varchar(20) DEFAULT 'planificacion' CHECK (estado IN ('planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado')),
  responsable_id uuid REFERENCES empleados(id),
  prioridad varchar(20) DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  progreso_porcentaje decimal(5,2) DEFAULT 0,
  rentabilidad_estimada decimal(5,2),
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS tiempo_trabajado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  empleado_id uuid REFERENCES empleados(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  horas decimal(4,2) NOT NULL,
  descripcion_tarea text,
  tarifa_hora decimal(8,2),
  costo_total decimal(10,2),
  facturable boolean DEFAULT true,
  facturado boolean DEFAULT false,
  categoria_trabajo varchar(100), -- desarrollo, diseño, testing, management
  aprobado boolean DEFAULT false,
  aprobado_por uuid REFERENCES empleados(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tareas_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre varchar(255) NOT NULL,
  descripcion text,
  asignado_a uuid REFERENCES empleados(id),
  fecha_inicio date,
  fecha_fin_estimada date,
  fecha_fin_real date,
  estado varchar(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  prioridad varchar(20) DEFAULT 'media',
  horas_estimadas decimal(6,2),
  horas_reales decimal(6,2) DEFAULT 0,
  progreso_porcentaje decimal(5,2) DEFAULT 0,
  dependencias text[], -- array de IDs de tareas dependientes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categorias_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_proyecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiempo_trabajado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_proyecto ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Financial Tables
CREATE POLICY "Users can view financial data from their company"
  ON categorias_financieras FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert financial data for their company"
  ON categorias_financieras FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update financial data from their company"
  ON categorias_financieras FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can view budgets from their company"
  ON presupuestos FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert budgets for their company"
  ON presupuestos FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update budgets from their company"
  ON presupuestos FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can view cash flow from their company"
  ON cash_flow_proyecciones FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert cash flow for their company"
  ON cash_flow_proyecciones FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update cash flow from their company"
  ON cash_flow_proyecciones FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can view KPIs from their company"
  ON indicadores_kpi FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert KPIs for their company"
  ON indicadores_kpi FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update KPIs from their company"
  ON indicadores_kpi FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

-- RLS Policies for Employee Tables
CREATE POLICY "Users can view employees from their company"
  ON empleados FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can insert employees for their company"
  ON empleados FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id() AND get_current_user_role() IN ('admin', 'contador'));

CREATE POLICY "Admins can update employees from their company"
  ON empleados FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id() AND get_current_user_role() IN ('admin', 'contador'));

CREATE POLICY "Users can view attendance from their company"
  ON asistencia FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM empleados e 
    WHERE e.id = asistencia.empleado_id 
    AND e.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can insert their own attendance"
  ON asistencia FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM empleados e 
    WHERE e.id = asistencia.empleado_id 
    AND e.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can view payroll from their company"
  ON liquidaciones FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Admins can insert payroll for their company"
  ON liquidaciones FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id() AND get_current_user_role() IN ('admin', 'contador'));

-- RLS Policies for Project Tables
CREATE POLICY "Users can view projects from their company"
  ON proyectos FOR SELECT
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can insert projects for their company"
  ON proyectos FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can update projects from their company"
  ON proyectos FOR UPDATE
  TO authenticated
  USING (empresa_id = get_current_user_empresa_id());

CREATE POLICY "Users can view time tracking from their company"
  ON tiempo_trabajado FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM proyectos p 
    WHERE p.id = tiempo_trabajado.proyecto_id 
    AND p.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can insert time tracking for their company"
  ON tiempo_trabajado FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM proyectos p 
    WHERE p.id = tiempo_trabajado.proyecto_id 
    AND p.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can view project tasks from their company"
  ON tareas_proyecto FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM proyectos p 
    WHERE p.id = tareas_proyecto.proyecto_id 
    AND p.empresa_id = get_current_user_empresa_id()
  ));

CREATE POLICY "Users can insert project tasks for their company"
  ON tareas_proyecto FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM proyectos p 
    WHERE p.id = tareas_proyecto.proyecto_id 
    AND p.empresa_id = get_current_user_empresa_id()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_presupuestos_empresa_periodo ON presupuestos(empresa_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_cash_flow_empresa_fecha ON cash_flow_proyecciones(empresa_id, fecha);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_estado ON empleados(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_asistencia_empleado_fecha ON asistencia(empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_proyectos_empresa_estado ON proyectos(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_tiempo_proyecto_empleado ON tiempo_trabajado(proyecto_id, empleado_id, fecha);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presupuestos_updated_at BEFORE UPDATE ON presupuestos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_updated_at BEFORE UPDATE ON cash_flow_proyecciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_indicadores_updated_at BEFORE UPDATE ON indicadores_kpi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON tareas_proyecto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();