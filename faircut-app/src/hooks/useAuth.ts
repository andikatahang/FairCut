import { useState } from 'react'
import type { User, UserRole } from '../types'
import { mockUsers } from '../data/mockData'

const SESSION_KEY = 'faircut_role'

function getPersistedUser(): User | null {
  try {
    const role = sessionStorage.getItem(SESSION_KEY) as UserRole | null
    if (role && mockUsers[role]) return mockUsers[role]
  } catch {}
  return null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getPersistedUser)

  const login = (role: UserRole) => {
    const u = mockUsers[role] ?? mockUsers.superadmin
    sessionStorage.setItem(SESSION_KEY, u.role)
    setUser(u)
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return { user, login, logout, isAuthenticated: user !== null }
}
