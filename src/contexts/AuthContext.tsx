import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  
  // Refs para evitar llamadas duplicadas
  const profileFetchedRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    // Evitar llamadas duplicadas
    if (isFetchingRef.current) {
      console.log('⚠️ Evitando llamada duplicada a fetchProfile');
      return null;
    }

    isFetchingRef.current = true;
    
    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      if (data) {
        console.log('✅ [AuthContext] Profile fetched successfully:', data);
        profileFetchedRef.current.add(userId);
      }

      return data;
    } catch (error) {
      console.error('❌ Exception fetching profile:', error);
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  };

  const createProfile = async (userId: string, email: string, userData?: any): Promise<UserProfile | null> => {
    try {
      console.log('📝 Creating profile for user:', userId, email);
      
      // Buscar empresa activa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresa')
        .select('id, nombre')
        .eq('activa', true)
        .limit(1)
        .single();

      if (empresaError || !empresa) {
        console.error('❌ No active empresa found:', empresaError);
        toast.error('No hay empresa configurada. Contacta al administrador.');
        return null;
      }

      const profileData = {
        id: userId,
        username: userData?.username || email.split('@')[0],
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: email,
        empresa_id: empresa.id,
        role: 'usuario' as const
      };

      console.log('📝 Creating profile with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return null;
      }

      console.log('✅ Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception creating profile:', error);
      return null;
    }
  };

  const getRolePermissions = (role: string): string[] => {
    const rolePermissions: Record<string, string[]> = {
      developer: ['super_admin', 'developer_config', 'manage_users', 'view_all', 'edit_all'],
      admin: ['manage_users', 'view_all', 'edit_all'],
      contador: ['view_all', 'edit_all'],
      usuario: ['view_own', 'edit_own']
    };
    return rolePermissions[role] || [];
  };

  // Setup auth state listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state change:', event);
        
        if (session?.user) {
          setSession(session);
          
          const extendedUser: ExtendedUser = {
            ...session.user,
            pyme_id: '',
            pyme_nombre: 'OnePyme',
            permissions: []
          };
          setUser(extendedUser);
          
          // Buscar perfil solo si no lo tenemos
          if (!profile || profile.id !== session.user.id) {
            const profileData = await fetchProfile(session.user.id);
            
            if (mounted) {
              if (profileData) {
                setProfile(profileData);
                
                const updatedUser: ExtendedUser = {
                  ...extendedUser,
                  pyme_id: profileData.empresa_id || '',
                  pyme_nombre: 'OnePyme',
                  permissions: getRolePermissions(profileData.role)
                };
                setUser(updatedUser);
              } else if (event === 'SIGNED_IN') {
                // Si no hay perfil y es un login nuevo, intentar crearlo
                console.log('⚠️ No profile found, creating one...');
                const newProfile = await createProfile(session.user.id, session.user.email || '');
                if (newProfile && mounted) {
                  setProfile(newProfile);
                  const updatedUser: ExtendedUser = {
                    ...extendedUser,
                    pyme_id: newProfile.empresa_id || '',
                    pyme_nombre: 'OnePyme',
                    permissions: getRolePermissions(newProfile.role)
                  };
                  setUser(updatedUser);
                }
              }
            }
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          profileFetchedRef.current.clear();
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check initial session
    const checkInitialSession = async () => {
      try {
        console.log('🔍 [AuthContext] Checking initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          console.log('✅ Initial session found, auth state change will handle it');
        } else if (mounted) {
          console.log('❌ No initial session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error checking initial session:', error);
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
  }, []); // Solo ejecutar una vez

  const signUp = async (email: string, password: string, userData: { username: string; first_name: string; last_name: string }) => {
    console.log('📝 Attempting signup for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error);
      toast.error(`Error en registro: ${error.message}`);
    } else {
      console.log('✅ Signup successful for:', email);
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Usuario registrado. Revisa tu email para confirmar.');
      } else {
        toast.success('Usuario registrado exitosamente.');
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔍 [AuthContext] Attempting signin for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ [AuthContext] Signin error:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Debes confirmar tu email antes de iniciar sesión');
        } else {
          toast.error(`Error: ${error.message}`);
        }
        setLoading(false);
        return { error };
      }
      
      if (data.user) {
        console.log('✅ [AuthContext] Signin successful');
        
        // El onAuthStateChange manejará el resto
        // Solo asegurarnos de que el perfil se cargue
        const userProfile = await fetchProfile(data.user.id);
        
        if (!userProfile) {
          console.log('⚠️ No profile found, creating one...');
          const newProfile = await createProfile(data.user.id, data.user.email || '');
          if (newProfile) {
            setProfile(newProfile);
          }
        } else {
          setProfile(userProfile);
        }
      }
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('❌ Exception during signin:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out user');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    profileFetchedRef.current.clear();
    toast.success('Sesión cerrada exitosamente');
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role || false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin' || profile?.role === 'developer';
  };

  // Legacy compatibility
  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    signOut();
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const value = {
    user,
    profile,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    hasRole,
    isAdmin,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};