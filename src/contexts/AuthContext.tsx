import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended user interface for legacy compatibility
interface ExtendedUser extends User {
  pyme_id?: string;
  pyme_nombre?: string;
  permissions?: string[];
}

interface UserProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  empresa_id: string | null;
  role: 'admin' | 'contador' | 'usuario';
  avatar_url: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  profile: UserProfile | null;
  session: Session | null;
  signUp: (email: string, password: string, userData: { username: string; first_name: string; last_name: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  // Legacy compatibility
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const createProfile = async (userId: string, email: string, userData?: any) => {
    try {
      console.log('Creating profile for user:', userId, email);
      
      // Get default empresa
      const { data: empresas, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('nombre', 'ContaPYME Default')
        .single();

      if (empresaError || !empresas) {
        console.error('Default empresa not found:', empresaError);
        return null;
      }

      console.log('Found empresa:', empresas);

      const profileData = {
        id: userId,
        username: userData?.username || email.split('@')[0],
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: email,
        empresa_id: empresas.id,
        role: 'usuario' as const
      };

      console.log('Creating profile with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };
   useEffect(() => {
  let mounted = true;

  // Set up auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        // Create extended user with legacy properties
        const extendedUser: ExtendedUser = {
          ...session.user,
          pyme_id: '',
          pyme_nombre: '',
          permissions: []
        };
        setUser(extendedUser);
        
        // Fetch user profile (setTimeout evita race conditions)
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            let profileData = await fetchProfile(session.user.id);
            
            // Si no existe perfil y es un login nuevo, crearlo
            if (!profileData && event === 'SIGNED_IN') {
              console.log('Creating profile for new user...');
              profileData = await createProfile(session.user.id, session.user.email!);
              if (profileData) {
                console.log('Profile created successfully');
              }
            }
            
            if (mounted) {
              setProfile(profileData);
              
              if (profileData) {
                // Update user with profile data
                const updatedUser: ExtendedUser = {
                  ...extendedUser,
                  pyme_id: profileData.empresa_id || '',
                  pyme_nombre: 'ContaPYME',
                  permissions: getRolePermissions(profileData.role)
                };
                setUser(updatedUser);
              }
            }
          } catch (error) {
            console.error('Error in profile handling:', error);
          }
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    }
  );

  // Check for existing session
  const checkInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(session);
      
      if (session?.user) {
        const extendedUser: ExtendedUser = {
          ...session.user,
          pyme_id: '',
          pyme_nombre: 'ContaPYME',
          permissions: []
        };
        setUser(extendedUser);
        
        const profileData = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(profileData);
          if (profileData) {
            const updatedUser: ExtendedUser = {
              ...extendedUser,
              pyme_id: profileData.empresa_id || '',
              pyme_nombre: 'ContaPYME',
              permissions: getRolePermissions(profileData.role)
            };
            setUser(updatedUser);
          }
        }
      } else {
        setUser(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking initial session:', error);
      if (mounted) {
        setLoading(false);
      }
    }
  };

  checkInitialSession();

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  const signUp = async (email: string, password: string, userData: { username: string; first_name: string; last_name: string }) => {
    console.log('Attempting signup for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      console.error('Signup error:', error);
      toast.error(`Error en registro: ${error.message}`);
    } else {
      console.log('Signup successful for:', email);
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Usuario registrado exitosamente. Si tienes configurado el email, revisa tu bandeja de entrada.');
      } else {
        toast.success('Usuario registrado y confirmado exitosamente.');
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔍 SIGNIN DEBUG - Starting signin for:', email);
    console.log('🔍 SIGNIN DEBUG - Environment check:', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      baseUrl: import.meta.env.BASE_URL,
      mode: import.meta.env.MODE,
      isGitHubPages: typeof window !== 'undefined' && window.location.hostname === 'chelof100.github.io'
    });
    
    // Verificar si es el usuario de prueba
    if (email === 'admin@contapyme.com' && password === 'admin123') {
      console.log('🔍 SIGNIN DEBUG - Using mock authentication for demo user');
      
      try {
        console.log('🔍 SIGNIN DEBUG - Attempting to query empresas table');
        // Obtener el ID real de la empresa default desde la base de datos
        const { data: empresaDefault, error: empresaError } = await supabase
          .from('empresas')
          .select('id')
          .eq('nombre', 'ContaPYME Default')
          .single();
        
        console.log('🔍 SIGNIN DEBUG - Empresas query result:', { empresaDefault, empresaError });
        
        let empresaId = empresaDefault?.id || null;
        
        // Si no hay empresa por defecto, crear una
        if (!empresaId) {
          console.log('🔍 SIGNIN DEBUG - Creating default empresa for demo');
          try {
            const { data: newEmpresa, error: empresaError } = await supabase
              .from('empresas')
              .insert({
                nombre: 'ContaPYME Default',
                razon_social: 'ContaPYME Default S.A.',
                cuit: '20-12345678-9',
                email: 'admin@contapyme.com',
                telefono: '+54 11 1234-5678',
                direccion: 'Av. Corrientes 1234, CABA',
                created_by: 'test-user-id-12345678901234567890'
              })
              .select('id')
              .single();
            
            console.log('🔍 SIGNIN DEBUG - Empresa creation result:', { newEmpresa, empresaError });
            
            if (!empresaError && newEmpresa) {
              empresaId = newEmpresa.id;
              console.log('🔍 SIGNIN DEBUG - Created default empresa with ID:', empresaId);
            } else {
              console.error('🔍 SIGNIN DEBUG - Error creating empresa:', empresaError);
            }
          } catch (error) {
            console.error('🔍 SIGNIN DEBUG - Exception creating default empresa:', error);
          }
        }
        
        console.log('🔍 SIGNIN DEBUG - Final empresa ID:', empresaId);
        
        const mockUser: ExtendedUser = {
          id: 'test-user-id-12345678901234567890',
          email: 'admin@contapyme.com',
          pyme_id: empresaId,
          pyme_nombre: 'ContaPYME Default',
          permissions: ['developer_config', 'manage_users', 'view_all', 'edit_all'],
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const mockProfile: UserProfile = {
          id: 'test-user-id-12345678901234567890',
          username: 'admin',
          first_name: 'Admin',
          last_name: 'Usuario',
          email: 'admin@contapyme.com',
          empresa_id: empresaId,
          role: 'admin',
          avatar_url: null
        };
        
        console.log('🔍 SIGNIN DEBUG - Setting user and profile:', { mockUser, mockProfile });
        
        setUser(mockUser);
        setProfile(mockProfile);
        
        console.log('✅ SIGNIN DEBUG - Mock signin successful for admin user with empresa_id:', empresaId);
        toast.success('¡Bienvenido al demo de ContaPYME!');
        return { error: null };
        
      } catch (error) {
        console.error('🔍 SIGNIN DEBUG - Exception in mock login:', error);
        toast.error('Error en el login de demo: ' + error.message);
        return { error };
      }
    }
    
    console.log('🔍 SIGNIN DEBUG - Attempting real Supabase signin for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('🔍 SIGNIN DEBUG - Signin error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos. Para el demo usa: admin@contapyme.com / admin123');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Debes confirmar tu email antes de iniciar sesión');
      } else {
        toast.error(`Error de autenticación: ${error.message}`);
      }
    } else {
      console.log('🔍 SIGNIN DEBUG - Signin successful for:', email);
      toast.success('¡Bienvenido a ContaPYME!');
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('Signing out user');
    await supabase.auth.signOut();
    toast.success('Sesión cerrada exitosamente');
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role || false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin' || false;
  };

  // Legacy compatibility methods
  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    signOut();
  };

  const getRolePermissions = (role: 'admin' | 'contador' | 'usuario'): string[] => {
    const rolePermissions: Record<string, string[]> = {
      admin: ['developer_config', 'manage_users', 'view_all', 'edit_all'],
      contador: ['view_all', 'edit_all'],
      usuario: ['view_own', 'edit_own']
    };
    return rolePermissions[role] || [];
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      loading, 
      hasRole, 
      isAdmin,
      // Legacy compatibility
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};