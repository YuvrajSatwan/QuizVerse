import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (error) {
      throw error
    }
  }

  const signInAsGuest = () => {
    // For guest users, we'll create a temporary user object
    const guestUser = {
      uid: `guest_${Date.now()}`,
      displayName: 'Guest User',
      email: null,
      isGuest: true
    }
    setCurrentUser(guestUser)
    return guestUser
  }

  const signOut = async () => {
    try {
      if (currentUser?.isGuest) {
        setCurrentUser(null)
      } else {
        await firebaseSignOut(auth)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    currentUser,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

