import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  
  // IMPORTANTE: Ref para evitar llamadas duplicadas
  const profileFetchedRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    // EVITAR LLAMADAS DUPLICADAS
    if (profileFetchedRef.current.has(userId) || isFetchingRef.current) {
      console.log('⚠️ Evitando llamada duplicada a fetchProfile para:', userId);
      return profile; // Retornar el perfil actual si ya lo tenemos
    }

    isFetchingRef.current = true;
    
    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      console.log('🔍 [AuthContext] About to make Supabase query...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Marcar como obtenido
      profileFetchedRef.current.add(userId);
      
      console.log('✅ [AuthContext] Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    } finally {
      isFetchingRef.current = false;
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

    // Setup auth listener - SIMPLIFICADO
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
          
          // SOLO buscar perfil si no lo tenemos
          if (!profile || profile.id !== session.user.id) {
            const profileData = await fetchProfile(session.user.id);
            
            if (mounted && profileData) {
              setProfile(profileData);
              
              // Actualizar usuario con datos del perfil
              const updatedUser: ExtendedUser = {
                ...extendedUser,
                pyme_nombre: 'OnePyme',
                permissions: getRolePermissions(profileData.role)
              };
              setUser(updatedUser);
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

    // Check initial session - SOLO UNA VEZ
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          // El onAuthStateChange manejará esto
          console.log('Initial session found, letting onAuthStateChange handle it');
        } else if (mounted) {
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
  }, []); // DEPENDENCIAS VACÍAS - Solo ejecutar una vez

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
        toast.error(`Error de autenticación: ${error.message}`);
      }
      return { error };
    }
    
    if (data.user) {
      console.log('✅ [AuthContext] Signin successful for:', email);
      console.log('🔍 [AuthContext] User data received:', data.user.id);
      
      // Crear usuario extendido
      const extendedUser: ExtendedUser = {
        ...data.user,
        pyme_nombre: 'OnePyme',
        permissions: []
      };
      
      // Fetch profile after successful login
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile) {
        console.log('✅ [AuthContext] Profile loaded after login:', userProfile);
        
        // Actualizar estado del contexto
        setProfile(userProfile);
        const updatedUser: ExtendedUser = {
          ...extendedUser,
          pyme_nombre: 'OnePyme',
          permissions: getRolePermissions(userProfile.role)
        };
        setUser(updatedUser);
        setSession(data.session);
        
        console.log('✅ [AuthContext] Context state updated with user and profile');
      } else {
        console.log('⚠️ [AuthContext] No profile found after login');
        
        // Si no hay perfil, crear uno
        const newProfile = await createProfile(data.user.id, data.user.email || '');
        if (newProfile) {
          setProfile(newProfile);
          const updatedUser: ExtendedUser = {
            ...extendedUser,
            pyme_nombre: 'OnePyme',
            permissions: getRolePermissions(newProfile.role)
          };
          setUser(updatedUser);
          setSession(data.session);
          console.log('✅ [AuthContext] New profile created and context updated');
        }
      }
    }
    
    return { error: null };
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