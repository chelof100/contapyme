// Cliente Supabase específico para DEMO (GitHub Pages)
// Este archivo solo se usa en el entorno de demo

// Mock de Supabase para demo - Versión completa con todos los métodos
const createMockQueryBuilder = (table: string) => {
  const mockData = {
    facturas: [
      { id: 1, numero: 'F001-00000001', cliente: 'Cliente Demo', monto: 15000, fecha: '2024-01-15' },
      { id: 2, numero: 'F001-00000002', cliente: 'Otro Cliente', monto: 25000, fecha: '2024-01-16' }
    ],
    clientes: [
      { id: 1, nombre: 'Cliente Demo', cuit: '20-12345678-9', email: 'cliente@demo.com' },
      { id: 2, nombre: 'Otro Cliente', cuit: '20-87654321-0', email: 'otro@cliente.com' }
    ],
    productos: [
      { id: 1, nombre: 'Producto Demo 1', precio: 1000, stock: 50 },
      { id: 2, nombre: 'Producto Demo 2', precio: 2000, stock: 25 }
    ],
    stock: [
      { id: 1, producto_id: 1, cantidad: 50, tipo: 'entrada', fecha: '2024-01-15' },
      { id: 2, producto_id: 2, cantidad: 25, tipo: 'entrada', fecha: '2024-01-16' }
    ],
    profiles: [
      { id: 'demo-user-123', email: 'admin@contapyme.com', name: 'ContaPYME Default', empresa_id: 'demo-empresa-123' }
    ],
    empresas: [
      { id: 'demo-empresa-123', nombre: 'ContaPYME Default', rut: '20-12345678-9', direccion: 'Calle Demo 123' }
    ],
    user_actions: [
      { id: 1, user_id: 'demo-user-123', action: 'page_view', page: 'dashboard', timestamp: new Date().toISOString() },
      { id: 2, user_id: 'demo-user-123', action: 'login', page: 'auth', timestamp: new Date().toISOString() }
    ],
    user_preferences: [
      { id: 1, user_id: 'demo-user-123', preference_key: 'theme', preference_value: 'light' },
      { id: 2, user_id: 'demo-user-123', preference_key: 'language', preference_value: 'es' }
    ]
  };

  const data = mockData[table as keyof typeof mockData] || [];
  
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          gte: () => ({
            lte: () => ({
              order: () => ({
                limit: () => ({
                  single: async () => ({ data: data[0] || null, error: null }),
                  then: async (callback: any) => callback({ data, error: null })
                }),
                single: async () => ({ data: data[0] || null, error: null }),
                then: async (callback: any) => callback({ data, error: null })
              }),
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            order: () => ({
              limit: () => ({
                single: async () => ({ data: data[0] || null, error: null }),
                then: async (callback: any) => callback({ data, error: null })
              }),
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          order: () => ({
            limit: () => ({
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        gte: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({ data: data[0] || null, error: null }),
                then: async (callback: any) => callback({ data, error: null })
              }),
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          order: () => ({
            limit: () => ({
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        order: () => ({
          limit: () => ({
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        single: async () => ({ data: data[0] || null, error: null }),
        then: async (callback: any) => callback({ data, error: null })
      }),
      gte: () => ({
        lte: () => ({
          order: () => ({
            limit: () => ({
              single: async () => ({ data: data[0] || null, error: null }),
              then: async (callback: any) => callback({ data, error: null })
            }),
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        order: () => ({
          limit: () => ({
            single: async () => ({ data: data[0] || null, error: null }),
            then: async (callback: any) => callback({ data, error: null })
          }),
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        single: async () => ({ data: data[0] || null, error: null }),
        then: async (callback: any) => callback({ data, error: null })
      }),
      order: () => ({
        limit: () => ({
          single: async () => ({ data: data[0] || null, error: null }),
          then: async (callback: any) => callback({ data, error: null })
        }),
        single: async () => ({ data: data[0] || null, error: null }),
        then: async (callback: any) => callback({ data, error: null })
      }),
      single: async () => ({ data: data[0] || null, error: null }),
      then: async (callback: any) => callback({ data, error: null })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => ({ data: { id: 'demo-insert-id', ...data }, error: null }),
        then: async (callback: any) => callback({ data: { id: 'demo-insert-id', ...data }, error: null })
      }),
      then: async (callback: any) => callback({ data: { id: 'demo-insert-id' }, error: null })
    }),
    update: (data: any) => ({
      eq: () => ({
        then: async (callback: any) => callback({ data: { id: 'demo-update-id' }, error: null })
      })
    }),
    delete: () => ({
      eq: () => ({
        then: async (callback: any) => callback({ data: { id: 'demo-delete-id' }, error: null })
      })
    })
  };
};

const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (email === 'admin@contapyme.com' && password === 'admin123') {
        return {
          data: {
            user: {
              id: 'demo-user-123',
              email: 'admin@contapyme.com',
              user_metadata: { name: 'ContaPYME Default' }
            },
            session: {
              access_token: 'demo-token',
              refresh_token: 'demo-refresh',
              user: {
                id: 'demo-user-123',
                email: 'admin@contapyme.com'
              }
            }
          },
          error: null
        };
      }
      return {
        data: { user: null, session: null },
        error: { message: 'Credenciales inválidas' }
      };
    },
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: 'demo-user-123',
            email: 'admin@contapyme.com'
          }
        });
      }, 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => ({
      data: {
        session: {
          user: {
            id: 'demo-user-123',
            email: 'admin@contapyme.com'
          }
        }
      },
      error: null
    }),
    getUser: async () => ({
      data: {
        user: {
          id: 'demo-user-123',
          email: 'admin@contapyme.com',
          user_metadata: { name: 'ContaPYME Default' }
        }
      },
      error: null
    })
  },
  from: createMockQueryBuilder,
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({
        data: { path },
        error: null
      }),
      download: async (path: string) => ({
        data: new Blob(['demo file content']),
        error: null
      })
    })
  }
};

export { supabase };
export default supabase;