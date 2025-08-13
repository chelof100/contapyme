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
  role: 'admin' | 'contador' | 'usuario' | 'developer';
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
      
      // Buscar empresa existente en lugar de usar empresa_id hardcodeado
      const { data: empresas, error: empresaError } = await supabase
        .from('empresa')
        .select('id, nombre')
        .limit(1)
        .single();

      if (empresaError || !empresas) {
        console.error('Error fetching empresa or no empresa exists:', empresaError);
        throw new Error('No hay empresa configurada en el sistema. Contacta al administrador.');
      }

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
          console.log('🔍 [AuthContext] User session detected:', session.user.email);
          
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
                  console.log('✅ [AuthContext] Profile loaded successfully:', {
                    empresa_id: profileData.empresa_id,
                    role: profileData.role
                  });
                  
                  // Si el perfil no tiene empresa_id, usar el ID por defecto
                  if (!profileData.empresa_id) {
                    console.log('⚠️ [AuthContext] Profile has no empresa_id, using default empresa...');
                    profileData.empresa_id = '00000000-0000-0000-0000-000000000001';
                  }
                  
                  // Update user with profile data
                  const updatedUser: ExtendedUser = {
                    ...extendedUser,
                    pyme_id: profileData.empresa_id || '',
                    pyme_nombre: 'OnePYME',
                    permissions: getRolePermissions(profileData.role)
                  };
                  setUser(updatedUser);
                } else {
                  // Si no hay perfil, usar valores por defecto
                  const defaultUser: ExtendedUser = {
                    ...extendedUser,
                    pyme_id: '',
                    pyme_nombre: 'OnePYME',
                    permissions: []
                  };
                  setUser(defaultUser);
                }
              }
            } catch (error) {
              console.error('Error in auth state change:', error);
              if (mounted) {
                setUser(null);
                setProfile(null);
              }
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
            pyme_nombre: 'OnePYME',
            permissions: []
          };
          setUser(extendedUser);
          
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            if (profileData) {
              // Si el perfil no tiene empresa_id, usar el ID por defecto
              if (!profileData.empresa_id) {
                profileData.empresa_id = '00000000-0000-0000-0000-000000000001';
              }
              
              setProfile(profileData);
              const updatedUser: ExtendedUser = {
                ...extendedUser,
                pyme_id: profileData.empresa_id || '',
                pyme_nombre: 'OnePYME',
                permissions: getRolePermissions(profileData.role)
              };
              setUser(updatedUser);
            } else {
              // Si no hay perfil, crear uno
              console.log('⚠️ [AuthContext] No profile found, creating one...');
              const newProfile = await createProfile(session.user.id, session.user.email || '');
              if (newProfile) {
                setProfile(newProfile);
                const updatedUser: ExtendedUser = {
                  ...extendedUser,
                  pyme_id: newProfile.empresa_id || '',
                  pyme_nombre: 'OnePYME',
                  permissions: getRolePermissions(newProfile.role)
                };
                setUser(updatedUser);
              }
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
    console.log('Attempting signin for:', email);
    

    

    
    console.log('Attempting real Supabase signin for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Signin error:', error);
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Debes confirmar tu email antes de iniciar sesión');
      } else {
        toast.error(`Error de autenticación: ${error.message}`);
      }
    } else {
      console.log('Signin successful for:', email);
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
    return profile?.role === 'admin' || profile?.role === 'developer' || false;
  };

  // Legacy compatibility methods
  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    signOut();
  };

  const getRolePermissions = (role: 'admin' | 'contador' | 'usuario' | 'developer'): string[] => {
    const rolePermissions: Record<string, string[]> = {
      developer: ['super_admin', 'developer_config', 'manage_users', 'view_all', 'edit_all', 'system_config', 'database_access', 'api_management'],
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