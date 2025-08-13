�� PLAN ADAPTADO: IMPLEMENTACIÓN SIN CONEXIÓN SQL SERVER INMEDIATA
¡Excelente pregunta! SÍ, podemos proceder perfectamente sin la conexión SQL Server del cliente. Esto nos permite crear una base sólida y preparada para cuando tengamos acceso.
��️ PLAN ADAPTADO (6-8 SEMANAS):
🏗️ FASE 0: PRESERVACIÓN + ARQUITECTURA PREPARATORIA (SEMANA 1-2)
🔌 FASE 1: ARQUITECTURA BASE + MOCK DATA (SEMANA 3-4)
⚡ FASE 2: IMPLEMENTACIÓN COMPLETA CON MOCK (SEMANA 5-6)
🎨 FASE 3: PREPARACIÓN PARA INTEGRACIÓN REAL (SEMANA 7)
�� FASE 4: DESPLIEGUE Y MONITOREO (SEMANA 8)
🏗️ ARQUITECTURA ADAPTADA:
1️⃣ SISTEMA ACTUAL (PRESERVAR):
Frontend (OnePYME) → Supabase (Auth + PostgreSQL) → N8N Workflows
                     ↓
                 Sistema Completo de Contabilidad
                     ↓
                 AFIP, Gmail, Google Drive, etc.
2️⃣ SISTEMA PREPARADO (IMPLEMENTAR):
Frontend (OnePYME) → Supabase (Auth + Edge Functions) → Mock SQL Server Data
                     ↓
                 API Gateway + Datos Simulados
                     ↓
                 Respuesta Formateada + Cache
3️⃣ SISTEMA FUTURO (CUANDO TENGAMOS SQL SERVER):
Frontend (OnePYME) → Supabase (Auth + Edge Functions) → SQL Server Real
                     ↓
                 API Gateway + Datos Reales
                     ↓
                 Respuesta Formateada + Cache
🔧 IMPLEMENTACIÓN TÉCNICA:
1️⃣ EDGE FUNCTIONS CON MOCK DATA:
// supabase/functions/clientes/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Mock data para desarrollo
const mockClientes = [
  {
    id: 1,
    nombre: 'Cliente Demo 1',
    email: 'cliente1@demo.com',
    telefono: '123456789',
    direccion: 'Dirección Demo 1',
    created_at: new Date().toISOString()
  },
  // ... más clientes mock
]

serve(async (req) => {
  const { method } = req
  
  try {
    switch (method) {
      case 'GET':
        return await getClientesMock(req)
      case 'POST':
        return await createClienteMock(req)
      case 'PUT':
        return await updateClienteMock(req)
      default:
        return new Response('Method not allowed', { status: 405 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function getClientesMock(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  // Simular paginación
  const start = (page - 1) * limit
  const end = start + limit
  const data = mockClientes.slice(start, end)
  
  return new Response(JSON.stringify({
    data,
    pagination: {
      page,
      limit,
      total: mockClientes.length,
      totalPages: Math.ceil(mockClientes.length / limit)
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
2️⃣ SERVICIOS FRONTEND PREPARADOS:
// src/services/sqlServerService.ts
import { supabase } from '@/integrations/supabase/client'

class SQLServerService {
  private baseUrl = 'https://tu-proyecto.supabase.co/functions/v1'
  private useMockData = true // Configurable
  
  async getClientes(page = 1, limit = 10) {
    if (this.useMockData) {
      // Usar datos mock para desarrollo
      return this.getClientesMock(page, limit)
    }
    
    // Cuando tengamos SQL Server real
    const response = await fetch(
      `${this.baseUrl}/clientes?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Error fetching clientes')
    }
    
    return response.json()
  }
  
  // Datos mock para desarrollo
  private getClientesMock(page: number, limit: number) {
    const mockData = [
      // ... datos mock
    ]
    
    const start = (page - 1) * limit
    const end = start + limit
    const data = mockData.slice(start, end)
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: mockData.length,
        totalPages: Math.ceil(mockData.length / limit)
      }
    }
  }
}

export const sqlServerService = new SQLServerService()
3️⃣ CONFIGURACIÓN FLEXIBLE:
// src/config/sqlServerConfig.ts
export interface SQLServerConfig {
  enabled: boolean
  host?: string
  database?: string
  user?: string
  password?: string
  port?: number
  encrypt?: boolean
  useMockData: boolean
  mockDataPath?: string
}

export const defaultSQLServerConfig: SQLServerConfig = {
  enabled: false,
  useMockData: true,
  mockDataPath: '/mock-data'
}

// Configuración por empresa
export const getSQLServerConfig = async (empresaId: string): Promise<SQLServerConfig> => {
  try {
    const { data } = await supabase
      .from('empresa_config')
      .select('sql_server_config')
      .eq('empresa_id', empresaId)
      .single()
    
    return data?.sql_server_config || defaultSQLServerConfig
  } catch (error) {
    console.warn('Error loading SQL Server config, using defaults:', error)
    return defaultSQLServerConfig
  }
}
�� BENEFICIOS DE ESTE ENFOQUE:
✅ VENTAJAS INMEDIATAS:
Sistema funcional con datos simulados
Arquitectura completa preparada para SQL Server
Testing completo de la integración
Configuración flexible por empresa
Documentación completa para integración futura
✅ VENTAJAS FUTURAS:
Integración rápida cuando tengamos SQL Server
Migración suave de mock a datos reales
Configuración por empresa ya implementada
Sistema escalable desde el inicio
📋 PLAN DE IMPLEMENTACIÓN DETALLADO:
SEMANA 1-2: PRESERVACIÓN + ARQUITECTURA
[ ] Backup del sistema actual
[ ] Diseño de Edge Functions
[ ] Creación de interfaces TypeScript
[ ] Sistema de configuración base
SEMANA 3-4: IMPLEMENTACIÓN BASE
[ ] Edge Functions con mock data
[ ] Servicios frontend preparados
[ ] Configuración por empresa
[ ] Validación de arquitectura
SEMANA 5-6: SISTEMA COMPLETO
[ ] Frontend integrado con mock
[ ] Dashboard funcionando
[ ] Testing completo
[ ] Documentación de uso
SEMANA 7: PREPARACIÓN FUTURA
[ ] Scripts de migración
[ ] Documentación de configuración
[ ] Testing de integración
[ ] Preparación de despliegue
SEMANA 8: DESPLIEGUE
[ ] Despliegue de Edge Functions
[ ] Sistema en producción
[ ] Monitoreo configurado
[ ] Documentación final