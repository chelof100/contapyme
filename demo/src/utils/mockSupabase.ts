// Mock completo de Supabase para DEMO
export const mockSupabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      if (email === 'demo@contapyme.com' && password === 'demo123') {
        return {
          data: {
            user: {
              id: 'demo-user-123',
              email: 'demo@contapyme.com',
              user_metadata: { name: 'Usuario Demo' }
            },
            session: {
              access_token: 'demo-token',
              refresh_token: 'demo-refresh',
              user: {
                id: 'demo-user-123',
                email: 'demo@contapyme.com'
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
    signOut: async () => ({
      error: null
    }),
    onAuthStateChange: (callback: any) => {
      // Simular cambio de estado de autenticación
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: {
            id: 'demo-user-123',
            email: 'demo@contapyme.com'
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
            email: 'demo@contapyme.com'
          }
        }
      },
      error: null
    })
  },
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'profiles' && column === 'id') {
            return {
              data: {
                id: 'demo-user-123',
                email: 'demo@contapyme.com',
                name: 'Usuario Demo',
                empresa_id: 'demo-empresa-123'
              },
              error: null
            };
          }
          if (table === 'empresas' && column === 'id') {
            return {
              data: {
                id: 'demo-empresa-123',
                nombre: 'Empresa Demo S.A.',
                cuit: '20-12345678-9',
                direccion: 'Calle Demo 123'
              },
              error: null
            };
          }
          return { data: null, error: null };
        },
        then: async (callback: any) => {
          const result = await mockSupabase.from(table).select(columns).eq(column, value).single();
          return callback(result);
        }
      }),
      then: async (callback: any) => {
        // Mock data para diferentes tablas
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
          ]
        };
        
        const data = mockData[table as keyof typeof mockData] || [];
        return callback({ data, error: null });
      }
    }),
    insert: (data: any) => ({
      then: async (callback: any) => {
        return callback({ data: { id: 'demo-insert-id' }, error: null });
      }
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        then: async (callback: any) => {
          return callback({ data: { id: value }, error: null });
        }
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (callback: any) => {
          return callback({ data: { id: value }, error: null });
        }
      })
    })
  }),
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

export default mockSupabase; 