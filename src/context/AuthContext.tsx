import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { User } from '../types'
import { usersService } from '../lib/services'
import { swalConfig } from '../lib/sweetAlert'
import Swal from 'sweetalert2'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to convert auth error messages to user-friendly Spanish text
function getAuthErrorMessage(errorMessage: string): string {
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Credenciales inválidas. Por favor verifica tu correo y contraseña.'
  }
  if (errorMessage.includes('Email not confirmed')) {
    return 'Por favor verifica tu correo electrónico para activar tu cuenta.'
  }
  if (errorMessage.includes('User already registered')) {
    return 'Ya existe una cuenta con este correo. Por favor inicia sesión.'
  }
  if (errorMessage.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (errorMessage.includes('Invalid email')) {
    return 'Por favor ingresa un correo electrónico válido.'
  }
  if (errorMessage.includes('Too many requests')) {
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'
  }
  if (errorMessage.includes('Network error')) {
    return 'Error de conexión a internet o Supabase no disponible.'
  }
  return errorMessage || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.warn('Error al obtener sesión de Supabase:', err)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          name: data.name,
          email: data.email,
          role: data.role as any,
          permissions: data.permissions || [],
          active: data.active ?? true,
          lastLogin: data.last_login ? new Date(data.last_login) : undefined,
          avatar: data.avatar || undefined
        })
      }
    } catch (error) {
      console.error('Error al cargar perfil de Supabase:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error de Perfil',
        text: 'No se pudo cargar el perfil del usuario en la base de datos.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      })
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      swalConfig.success('¡Bienvenido! Has iniciado sesión correctamente.')
    } catch (error: any) {
      setLoading(false)
      swalConfig.error(`Fallo de inicio de sesión: ${getAuthErrorMessage(error.message)}`)
      throw error
    }
  }

  async function signUp(email: string, password: string, name: string, username: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username,
          }
        }
      })
      if (error) throw error

      if (data.user) {
        // Check if there are other users to assign role (first user becomes admin)
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const assignedRole = (count === 0 || count === null) ? 'admin' : 'cashier';
        const assignedPermissions = assignedRole === 'admin' ? ['all'] : ['pos_access'];

        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            name,
            email,
            role: assignedRole,
            permissions: assignedPermissions,
            active: true
          })
          .select()
          .single()

        if (profileError) {
          console.error('Error al crear perfil:', profileError)
          throw new Error(`Error al crear perfil de usuario: ${profileError.message}`)
        }

        if (profileData) {
          setProfile({
            id: profileData.id,
            username: profileData.username,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as any,
            permissions: profileData.permissions || [],
            active: profileData.active ?? true,
            lastLogin: profileData.last_login ? new Date(profileData.last_login) : undefined,
            avatar: profileData.avatar || undefined
          })
        }
      }
      
      setLoading(false)
      swalConfig.success('¡Cuenta creada con éxito!')
    } catch (error: any) {
      setLoading(false)
      swalConfig.error(`Fallo al registrarse: ${getAuthErrorMessage(error.message)}`)
      throw error
    }
  }

  async function signOut() {
    setLoading(true)
    try {
      setUser(null)
      setProfile(null)
      setSession(null)
      await supabase.auth.signOut()
      swalConfig.success('Sesión cerrada correctamente.')
    } catch (e) {
      console.warn('Error al cerrar sesión:', e)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates: Partial<User>) {
    if (!user) throw new Error('No hay usuario conectado')
    
    try {
      const updatedProfile = await usersService.update(user.id, updates)
      setProfile(updatedProfile)
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
