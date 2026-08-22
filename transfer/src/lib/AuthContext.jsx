import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setRole(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      const { data: candidateData } = await supabase
        .from('students')
        .select('*')
        .eq('auth_id', userId)
        .single()
        .catch(() => ({ data: null }))

      if (candidateData) {
        setProfile(candidateData)
        setRole('candidate')
        return
      }

      const { data: recruiterData } = await supabase
        .from('recruiters')
        .select('*')
        .eq('auth_id', userId)
        .single()
        .catch(() => ({ data: null }))

      if (recruiterData) {
        setProfile(recruiterData)
        setRole('recruiter')
        return
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signUp = async (email, password, userData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError

      if (authData.user) {
        const profileData = { ...userData, auth_id: authData.user.id }
        const table = userData.role === 'recruiter' ? 'recruiters' : 'students'

        const { error: profileError } = await supabase.from(table).insert([profileData])
        if (profileError) throw profileError
      }

      return authData.user
    } catch (error) {
      throw error
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data.user
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      setRole(null)
    } catch (error) {
      throw error
    }
  }

  const updateProfile = async (updates) => {
    try {
      const table = role === 'recruiter' ? 'recruiters' : 'students'
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', profile.id)
        .select()

      if (error) throw error
      setProfile(data[0])
      return data[0]
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      loading,
      isAuthenticated: !!user,
      signUp,
      signIn,
      signOut,
      updateProfile,
      loadUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
