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
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
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