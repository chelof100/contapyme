import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended user interface for single-tenant system
interface ExtendedUser extends User {
  pyme_nombre?: string;
  permissions?: string[];
}

interface UserProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      console.log('🔍 [AuthContext] Using RPC function...');
      
      // Usar RPC en lugar de consulta directa
      const { data, error } = await (supabase as any)
        .rpc('get_profile_data', { user_id: userId })
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      if (data) {
        console.log('✅ [AuthContext] Profile fetched successfully via RPC:', data);
        return data;
      }

      console.log('⚠️ [AuthContext] No profile found');
      return null;
    } catch (error) {
      console.error('❌ Exception fetching profile:', error);
      return null;
    }
  };

  const createProfile = async (userId: string, email: string, userData?: any) => {
    try {
      console.log('Creating profile for user:', userId, email);
      
      // Verificar que existe configuración de empresa
      const { data: configEmpresa, error: configError } = await supabase
        .from('empresa')
        .select('id, nombre')
        .limit(1)
        .single();

      if (configError || !configEmpresa) {
        console.error('Error fetching empresa or no config exists:', configError);
        throw new Error('No hay empresa configurada en el sistema. Contacta al administrador.');
      }

      console.log('✅ Empresa encontrada:', configEmpresa.nombre);

      const profileData = {
        id: userId,
        username: userData?.username || email.split('@')[0],
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        email: email,
        role: 'developer' as const, // Usuario developer por defecto
        avatar_url: null,
        empresa_id: configEmpresa.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Profile data to insert:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      console.log('✅ Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception creating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event);
        
        if (session?.user) {
          setSession(session);
          
          const extendedUser: ExtendedUser = {
            ...session.user,
            pyme_nombre: 'OnePyme',
            permissions: []
          };
          setUser(extendedUser);
          
          // NO buscar perfil aquí - el signIn lo manejará
          // Solo manejar el estado de sesión
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setLoading(false);
      }
      // Si hay sesión, el onAuthStateChange la manejará
    });

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
    console.log('🔍 [AuthContext] Attempting signin for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ [AuthContext] Signin error:', error);
        toast.error(error.message);
        setLoading(false);
        return { error };
      }
      
      if (data.user) {
        console.log('✅ [AuthContext] Signin successful for:', email);
        console.log('🔍 [AuthContext] User data received:', data.user.id);
        
        // Buscar perfil del usuario (UNA SOLA VEZ - solo aquí se ejecuta)
        const userProfile = await fetchProfile(data.user.id);
        
        if (userProfile) {
          console.log('✅ [AuthContext] Profile found after login:', userProfile);
          setProfile(userProfile);
          
          // Actualizar usuario con datos del perfil
          const extendedUser: ExtendedUser = {
            ...data.user,
            pyme_nombre: 'OnePyme',
            permissions: getRolePermissions(userProfile.role)
          };
          setUser(extendedUser);
          setSession(data.session);
          
          console.log('✅ [AuthContext] Context state updated successfully');
        } else {
          console.log('⚠️ [AuthContext] No profile found, creating one...');
          
          try {
            const newProfile = await createProfile(data.user.id, data.user.email || '');
            if (newProfile) {
              setProfile(newProfile);
              const extendedUser: ExtendedUser = {
                ...data.user,
                pyme_nombre: 'OnePyme',
                permissions: getRolePermissions(newProfile.role)
              };
              setUser(extendedUser);
              setSession(data.session);
              console.log('✅ [AuthContext] New profile created successfully');
            }
          } catch (createError) {
            // Si el error es 409, significa que el perfil ya existe
            // Intentar obtenerlo de nuevo
            console.log('⚠️ Profile might already exist, trying to fetch again...');
            const existingProfile = await fetchProfile(data.user.id);
            if (existingProfile) {
              setProfile(existingProfile);
              const extendedUser: ExtendedUser = {
                ...data.user,
                pyme_nombre: 'OnePyme',
                permissions: getRolePermissions(existingProfile.role)
              };
              setUser(extendedUser);
              setSession(data.session);
              console.log('✅ [AuthContext] Existing profile loaded successfully');
            }
          }
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
    console.log('Signing out user');
    await supabase.auth.signOut();
    toast.success('Sesión cerrada exitosamente');
  };

  const hasRole = (role: string): boolean => {
    return profile?.role === role || false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin' || profile?.role === 'developer';
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
    // Legacy compatibility
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