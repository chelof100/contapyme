// Mock de Supabase para testing en GitHub Pages
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
          return Promise.resolve({ data: null, error: null });
        },
        order: (column: string) => Promise.resolve({ data: [], error: null }),
        limit: (count: number) => Promise.resolve({ data: [], error: null })
      }),
      order: (column: string) => Promise.resolve({ data: [], error: null }),
      limit: (count: number) => Promise.resolve({ data: [], error: null })
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
          return Promise.resolve({ data: null, error: null });
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