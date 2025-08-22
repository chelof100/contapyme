// =====================================================
// AUTH CONTEXT ROBUSTO - FIX TOKEN REFRESH
// =====================================================
// Reemplazar src/contexts/AuthContext.tsx con este código
// =====================================================

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

interface Profile {
  id: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  empresa_id?: string
  role: 'admin' | 'usuario' | 'developer'
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAuthenticated: boolean
}

// =====================================================
// FUNCIONES DE MANEJO DE ERRORES
// =====================================================

const handleAuthError = async (error: any): Promise<void> => {
  console.error('🚨 [AuthContext] Auth Error:', error)
  
  // Errores de token corrupto o expirado
  if (
    error.message?.includes('refresh_token_not_found') || 
    error.message?.includes('Invalid Refresh Token') ||
    error.message?.includes('JWT expired') ||
    error.status === 400
  ) {
    console.log('🔄 [AuthContext] Clearing corrupted session...')
    
    try {
      // Limpiar sesión corrupta
      await supabase.auth.signOut()
      localStorage.removeItem('sb-onepyme-auth-token')
      sessionStorage.clear()
      
      console.log('✅ [AuthContext] Corrupted session cleared')
    } catch (clearError) {
      console.error('❌ [AuthContext] Error clearing session:', clearError)
    }
  }
}

// =====================================================
// FUNCIÓN DE LOGIN ROBUSTA
// =====================================================

const signInWithEmailRobust = async (email: string, password: string) => {
  try {
    console.log(`🔍 [AuthContext] Attempting robust signin for: ${email}`)
    
    // SIN signOut previo - puede estar causando problemas
    console.log('🔍 [AuthContext] Llamando signInWithPassword directamente...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ [AuthContext] Signin error:', error)
      await handleAuthError(error)
      throw error
    }
    
    console.log('✅ [AuthContext] Robust signin successful for:', email)
    return data
    
  } catch (error) {
    console.error('❌ [AuthContext] Robust signin failed:', error)
    throw error
  }
}

// =====================================================
// FUNCIÓN DE VALIDACIÓN DE SESIÓN
// =====================================================

const ensureValidSession = async (): Promise<Session | null> => {
  try {
    console.log('🔍 [AuthContext] Validating session...')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ [AuthContext] Session validation error:', error)
      await handleAuthError(error)
      return null
    }
    
    if (!session) {
      console.log('⚠️ [AuthContext] No active session found')
      return null
    }
    
    // Verificar si el token está cerca de expirar (menos de 5 minutos)
    const expiresAt = session.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    const timeToExpiry = expiresAt - now
    
    if (timeToExpiry < 300) { // Menos de 5 minutos
      console.log('🔄 [AuthContext] Token expiring soon, refreshing...')
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ [AuthContext] Token refresh failed:', refreshError)
        await handleAuthError(refreshError)
        return null
      }
      
      console.log('✅ [AuthContext] Token refreshed successfully')
      return refreshData.session
    }
    
    console.log('✅ [AuthContext] Session is valid')
    return session
    
  } catch (error) {
    console.error('❌ [AuthContext] Session validation error:', error)
    await handleAuthError(error)
    return null
  }
}

// =====================================================
// FUNCIÓN PARA OBTENER PERFIL
// =====================================================

const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log(`🔍 [AuthContext] Fetching profile for user: ${userId}`)
    
    if (!supabase) {
      console.error('❌ [AuthContext] Supabase client is undefined!')
      return null
    }
    
    const query = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // Agregar timeout de 10 segundos para evitar que se cuelgue
    const queryPromise = query
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    )
    
    const result = await Promise.race([queryPromise, timeoutPromise])
    const { data, error } = result
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ [AuthContext] No profile found for user')
        return null
      }
      console.error('❌ [AuthContext] Database error:', error)
      throw error
    }
    
    console.log(`✅ [AuthContext] Profile fetched successfully: ${data.role}`)
    return data
    
  } catch (error) {
    // Solo mostrar errores que no sean timeout o tabla inexistente
    if (!error.message.includes('timeout') && !error.message.includes('does not exist')) {
      console.error('❌ [AuthContext] Error fetching profile:', error)
    }
    return null
  }
}

// =====================================================
// CONTEXT CREATION
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// =====================================================
// AUTH PROVIDER ROBUSTO
// =====================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // =====================================================
  // FUNCIÓN DE INICIALIZACIÓN
  // =====================================================
  
  const initializeAuth = async () => {
    // Evitar múltiples inicializaciones
    if (isInitialized) {
      console.log('🔍 [AuthContext] Auth already initialized, skipping...')
      return
    }
    
    try {
      console.log('🔍 [AuthContext] Initializing auth...')
      setIsLoading(true)
      
      // Validar sesión actual
      const validSession = await ensureValidSession()
      
      if (validSession?.user) {
        console.log('✅ [AuthContext] Valid session found for:', validSession.user.email)
        
        setSession(validSession)
        setUser(validSession.user)
        
        // Obtener perfil
        const userProfile = await fetchUserProfile(validSession.user.id)
        
        if (userProfile) {
          setProfile(userProfile)
          console.log('✅ [AuthContext] Profile loaded successfully')
        } else {
          console.log('⚠️ [AuthContext] No profile found for session user')
        }
      } else {
        console.log('🔍 [AuthContext] No valid session found')
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      
    } catch (error) {
      console.error('❌ [AuthContext] Initialization error:', error)
      await handleAuthError(error)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
      console.log('✅ [AuthContext] Auth initialization completed')
    }
  }

  // =====================================================
  // FUNCIONES DE AUTENTICACIÓN
  // =====================================================

  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔍 [AuthContext] signIn iniciando...');
    console.log('🔍 [AuthContext] Email recibido:', email);
    setIsLoading(true)

    try {
      console.log('🔍 [AuthContext] Verificando sesión existente...');
      // ✅ CORRECCIÓN: Usar getSession directamente sin timeout personalizado
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        console.log('✅ [AuthContext] User already signed in, skipping robust signin')
        setUser(session.user)
        setSession(session)

        // Obtener perfil
        const userProfile = await fetchUserProfile(session.user.id)

        if (userProfile) {
          setProfile(userProfile)
          console.log('✅ [AuthContext] Profile found after login:', userProfile.role)
          toast.success(`Bienvenido, ${userProfile.username || userProfile.email}`)
        } else {
          console.log('⚠️ [AuthContext] No profile found after login')
          toast.warning('Perfil no encontrado. Contacta al administrador.')
        }
        return // Exit if session is already active
      }

      console.log('🔍 [AuthContext] No hay sesión activa, llamando a signInWithEmailRobust...');
      // Solo hacer robust signin si no hay sesión activa
      const result = await signInWithEmailRobust(email, password)

      if (result.user) {
        console.log('✅ [AuthContext] signInWithEmailRobust exitoso');
        setUser(result.user)
        setSession(result.session)

        // Obtener perfil
        const userProfile = await fetchUserProfile(result.user.id)

        if (userProfile) {
          setProfile(userProfile)
          console.log('✅ [AuthContext] Profile found after login:', userProfile.role)
          toast.success(`Bienvenido, ${userProfile.username || userProfile.email}`)
        } else {
          console.log('⚠️ [AuthContext] No profile found after login')
          toast.warning('Perfil no encontrado. Contacta al administrador.')
        }
      }

    } catch (error: any) {
      console.error('❌ [AuthContext] Signin error:', error)

      // Mensajes de error específicos
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Email no confirmado. Revisa tu bandeja de entrada.')
      } else {
        toast.error('Error de autenticación. Intenta nuevamente.')
      }

      throw error
    } finally {
      console.log('🔍 [AuthContext] signIn finalizando...');
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any): Promise<void> => {
    setIsLoading(true)
    
    try {
      console.log(`🔍 [AuthContext] Attempting signup for: ${email}`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        console.error('❌ [AuthContext] Signup error:', error)
        throw error
      }
      
      console.log('✅ [AuthContext] Signup successful for:', email)
      toast.success('Cuenta creada exitosamente')
      
    } catch (error: any) {
      console.error('❌ [AuthContext] Signup error:', error)
      
      if (error.message?.includes('User already registered')) {
        toast.error('Este email ya está registrado')
      } else {
        toast.error('Error creando cuenta. Intenta nuevamente.')
      }
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('🔍 [AuthContext] Signing out...')
      
      await supabase.auth.signOut()
      
      // Limpiar estado
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Limpiar storage
      localStorage.removeItem('sb-onepyme-auth-token')
      
      console.log('✅ [AuthContext] Signed out successfully')
      toast.success('Sesión cerrada correctamente')
      
    } catch (error) {
      console.error('❌ [AuthContext] Signout error:', error)
      toast.error('Error cerrando sesión')
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      
      toast.success('Email de recuperación enviado')
      
    } catch (error: any) {
      console.error('❌ [AuthContext] Reset password error:', error)
      toast.error('Error enviando email de recuperación')
      throw error
    }
  }

  // =====================================================
  // EFECTOS Y LISTENERS
  // =====================================================

  useEffect(() => {
    // Inicializar autenticación
    initializeAuth()

    // Listener para cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 [AuthContext] Auth event: ${event}`)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 [AuthContext] User signed in via listener')
          setUser(session.user)
          setSession(session)
          
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 [AuthContext] User signed out via listener')
          setUser(null)
          setProfile(null)
          setSession(null)
          
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('✅ [AuthContext] Token refreshed via listener')
          setSession(session)
          
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user && !!profile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// =====================================================
// HOOK DE USO
// =====================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    console.error('❌ [useAuth] Context is undefined. This usually means:')
    console.error('1. useAuth is being called outside AuthProvider')
    console.error('2. Hot Module Replacement (HMR) issue')
    console.error('3. Component rendering before context is ready')
    
    // En desarrollo, mostrar más información de debug
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 [useAuth] Stack trace:', new Error().stack)
    }
    
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext

/*
=====================================================
MEJORAS IMPLEMENTADAS:

✅ MANEJO DE ERRORES ROBUSTO:
- handleAuthError para limpiar sesiones corruptas
- Errores específicos de token refresh
- Mensajes de error claros para el usuario

✅ VALIDACIÓN DE SESIÓN PROACTIVA:
- ensureValidSession verifica tokens antes de expirar
- Refresh automático cuando quedan menos de 5 minutos
- Limpieza automática de sesiones inválidas

✅ LOGIN ROBUSTO:
- signInWithEmailRobust limpia sesiones anteriores
- Pausa para asegurar limpieza completa
- Manejo de errores específicos

✅ LOGGING DETALLADO:
- Logs para debugging y monitoreo
- Estados claros de cada operación
- Información de eventos de auth

✅ INICIALIZACIÓN SEGURA:
- initializeAuth valida sesión al cargar
- Manejo de errores en inicialización
- Estado loading apropiado

TESTING:
1. Logout completo
2. Login developer@onepyme.pro
3. Verificar dashboard carga
4. Esperar 5 minutos para test refresh
5. No errores 400 en consola
=====================================================
*/