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
  empresa_id?: string;
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

  // FUNCIÓN SIMPLE - Sin RPC, sin dependencias circulares
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      
      // CONSULTA DIRECTA SIMPLE - Sabemos que esta funciona perfectamente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ [AuthContext] Error fetching profile:', error);
        return null;
      }

      if (data) {
        console.log('✅ [AuthContext] Profile fetched successfully:', data.role);
        return data;
      }

      console.log('⚠️ [AuthContext] No profile found for user');
      return null;
    } catch (error) {
      console.error('❌ [AuthContext] Exception fetching profile:', error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, userData: { username: string; first_name: string; last_name: string }) => {
    console.log('🔍 [AuthContext] Attempting signup for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: 'usuario' // Rol por defecto
          }
        }
      });
      
      if (error) {
        console.error('❌ [AuthContext] Signup error:', error);
        toast.error(error.message);
      } else {
        console.log('✅ [AuthContext] Signup successful for:', email);
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Registro exitoso. Revisa tu email para confirmar la cuenta.');
        } else {
          toast.success('Usuario registrado y confirmado exitosamente.');
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('❌ [AuthContext] Exception during signup:', error);
      toast.error(error.message || 'Error durante el registro');
      return { error };
    } finally {
      setLoading(false);
    }
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
        return { error };
      }
      
      if (data.user) {
        console.log('✅ [AuthContext] Signin successful for:', email);
        console.log('🔍 [AuthContext] User ID:', data.user.id);
        
        // FLUJO SIMPLIFICADO - Solo buscar perfil UNA VEZ
        const userProfile = await fetchProfile(data.user.id);
        
        if (userProfile) {
          console.log('✅ [AuthContext] Profile found after login:', userProfile.role);
          
          // Actualizar estado del contexto
          setProfile(userProfile);
          setUser({
            ...data.user,
            pyme_nombre: 'OnePyme',
            permissions: getRolePermissions(userProfile.role)
          });
          setSession(data.session);
          
          console.log('✅ [AuthContext] Context state updated successfully');
          toast.success(`¡Bienvenido${userProfile.first_name ? ', ' + userProfile.first_name : ''}!`);
        } else {
          console.log('⚠️ [AuthContext] No profile found - trigger should have created it');
          // Para usuarios sin perfil, mostrar mensaje pero no fallar
          toast.warning('Perfil no encontrado. Contacta al administrador.');
        }
      }
      
      return { error: null };
      
    } catch (error: any) {
      console.error('❌ [AuthContext] Exception during signin:', error);
      toast.error(error.message || 'Error durante el login');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🔍 [AuthContext] Signing out user');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.success('Sesión cerrada exitosamente');
    } catch (error: any) {
      console.error('❌ [AuthContext] Error during signout:', error);
      toast.error('Error cerrando sesión');
    }
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

  // EFECTO ULTRA-SIMPLIFICADO - SOLO INICIALIZACIÓN UNA VEZ
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 [AuthContext] Initializing auth...');
        
        // Obtener sesión actual UNA SOLA VEZ
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (currentSession?.user && mounted) {
          console.log('✅ [AuthContext] Initial session found for:', currentSession.user.email);
          
          // Buscar perfil del usuario de la sesión UNA SOLA VEZ
          const userProfile = await fetchProfile(currentSession.user.id);
          
          if (userProfile && mounted) {
            console.log('✅ [AuthContext] Initial profile loaded:', userProfile.role);
            setProfile(userProfile);
            setUser({
              ...currentSession.user,
              pyme_nombre: 'OnePyme',
              permissions: getRolePermissions(userProfile.role)
            });
            setSession(currentSession);
          } else if (mounted) {
            console.log('⚠️ [AuthContext] No profile found for session user');
          }
        } else {
          console.log('🔍 [AuthContext] No initial session found');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error in initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // SOLO INICIALIZACIÓN - SIN LISTENERS
    initializeAuth();

    // Cleanup simple
    return () => {
      mounted = false;
    };
  }, []); // Sin dependencias para evitar loops

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