import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { initFirebase, onAuth, loginWithEmail, signUpWithEmail, loginWithGoogle, logout } from './firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    initFirebase().then(() => {
      const unsub = onAuth((user) => {
        setState({ user, loading: false, error: null })
        if (user) {
          syncUser(user)
        }
      })
      return () => unsub()
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }))
    try {
      await loginWithEmail(email, password)
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message }))
    }
  }

  const signUp = async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }))
    try {
      await signUpWithEmail(email, password)
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message }))
    }
  }

  const signInGoogle = async () => {
    setState((s) => ({ ...s, error: null }))
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message }))
    }
  }

  const signOut = async () => {
    await logout()
  }

  return { ...state, signIn, signUp, signInGoogle, signOut }
}

async function syncUser(firebaseUser: User) {
  try {
    const api = (window as any).electronAPI?.db
    if (!api) return
    const existing = await api.user.findByFirebaseUid(firebaseUser.uid)
    if (!existing) {
      await api.user.create({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        avatarUrl: firebaseUser.photoURL,
      })
    }
  } catch {}
}
