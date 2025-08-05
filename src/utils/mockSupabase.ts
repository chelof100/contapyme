// Mock de Supabase para testing en GitHub Pages
const mockData = {
  productos: [
    {
      id: 'prod-1',
      sku: 'PROD001',
      nombre: 'Producto Demo 1',
      descripcion: 'Descripción del producto demo 1',
      precio: 1500,
      stock_actual: 25,
      stock_minimo: 5,
      categoria: 'Electrónicos',
      empresa_id: 'mock-empresa-id-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'prod-2',
      sku: 'PROD002',
      nombre: 'Producto Demo 2',
      descripcion: 'Descripción del producto demo 2',
      precio: 2500,
      stock_actual: 10,
      stock_minimo: 3,
      categoria: 'Oficina',
      empresa_id: 'mock-empresa-id-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  facturas_emitidas: [
    {
      id: 'fact-1',
      numero_factura: '0001-00000001',
      cuit_cliente: '20-12345678-9',
      nombre_cliente: 'Cliente Demo SA',
      fecha: '2024-01-15',
      total: 15000,
      estado: 'pagada',
      empresa_id: 'mock-empresa-id-123',
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'fact-2',
      numero_factura: '0001-00000002',
      cuit_cliente: '20-87654321-9',
      nombre_cliente: 'Otro Cliente SRL',
      fecha: '2024-01-20',
      total: 8500,
      estado: 'pendiente',
      empresa_id: 'mock-empresa-id-123',
      created_at: '2024-01-20T00:00:00Z'
    }
  ],
  facturas_recibidas: [
    {
      id: 'fact-rec-1',
      numero_factura: 'A-0001-00000123',
      cuit_proveedor: '30-11111111-9',
      proveedor_nombre: 'Proveedor Demo SA',
      fecha_recepcion: '2024-01-10',
      monto: 5000,
      estado: 'pendiente',
      empresa_id: 'mock-empresa-id-123'
    }
  ],
  clientes: [
    {
      id: 'cli-1',
      cuit: '20-12345678-9',
      razon_social: 'Cliente Demo SA',
      nombre_fantasia: 'Cliente Demo',
      email: 'cliente@demo.com',
      telefono: '+54 11 1234-5678',
      estado: 'activo',
      categoria: 'VIP',
      empresa_id: 'mock-empresa-id-123',
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  movimientos_stock: [],
  pagos: [],
  alertas_stock: [
    {
      id: 'alert-1',
      producto_id: 'prod-2',
      sku: 'PROD002',
      nombre_producto: 'Producto Demo 2',
      stock_actual: 10,
      stock_minimo: 3,
      tipo_alerta: 'stock_bajo',
      empresa_id: 'mock-empresa-id-123'
    }
  ]
};

export const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: (credentials: any) => {
      // Mock login exitoso para GitHub Pages demo
      const mockUser = {
        id: 'demo-user-id',
        email: credentials.email || 'demo@contapyme.com',
        user_metadata: {
          full_name: 'Usuario Demo',
          avatar_url: null
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        aud: 'authenticated',
        role: 'authenticated'
      };
      
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      };

      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
    },
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Simular estado de autenticación
      const mockUser = {
        id: 'demo-user-id',
        email: 'demo@contapyme.com',
        user_metadata: { full_name: 'Usuario Demo' }
      };
      
      // Simular que el usuario está logueado
      setTimeout(() => callback('SIGNED_IN', mockUser), 100);
      
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => {
          // Mock específico para la tabla empresas
          if (table === 'empresas' && column === 'nombre' && value === 'ContaPYME Default') {
            return Promise.resolve({ 
              data: { 
                id: 'mock-empresa-id-123',
                nombre: 'ContaPYME Default',
                razon_social: 'ContaPYME Default S.A.'
              }, 
              error: null 
            });
          }
          
          // Mock para profiles
          if (table === 'profiles') {
            return Promise.resolve({
              data: {
                id: 'demo-user-id',
                empresa_id: 'mock-empresa-id-123',
                role: 'admin',
                email: 'admin@contapyme.com'
              },
              error: null
            });
          }
          
          return Promise.resolve({ data: null, error: null });
        },
        order: (column: string, options?: any) => {
          const data = mockData[table as keyof typeof mockData] || [];
          return Promise.resolve({ data, error: null });
        },
        limit: (count: number) => {
          const data = (mockData[table as keyof typeof mockData] || []).slice(0, count);
          return Promise.resolve({ data, error: null });
        }
      }),
      order: (column: string, options?: any) => {
        const data = mockData[table as keyof typeof mockData] || [];
        return Promise.resolve({ data, error: null });
      },
      limit: (count: number) => {
        const data = (mockData[table as keyof typeof mockData] || []).slice(0, count);
        return Promise.resolve({ data, error: null });
      }
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => {
          // Mock para insertar empresa
          if (table === 'empresas') {
            return Promise.resolve({ 
              data: { 
                id: 'mock-empresa-id-123',
                ...data
              }, 
              error: null 
            });
          }
          
          // Mock para insertar otros datos
          const newItem = {
            id: `${table}-${Date.now()}`,
            ...data,
            empresa_id: 'mock-empresa-id-123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          return Promise.resolve({ data: newItem, error: null });
        }
      })
    }),
    update: (data: any) => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ data: null, error: null })
    })
  }
};