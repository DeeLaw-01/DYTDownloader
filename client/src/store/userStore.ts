import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { StateCreator } from 'zustand'

interface UserState {
  user: Record<string, any> | null
  token: string | null
  isOtpGen: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: Record<string, any> | null) => void
  setToken: (token: string | null) => void
  setOtpGen: (isOtpGen: boolean) => void
  clearError: () => void
  logout: () => void
}

type UserStateCreator = StateCreator<
  UserState,
  [['zustand/devtools', never], ['zustand/persist', unknown]]
>

const userStore: UserStateCreator = set => ({
  user: null,
  token: null,
  isOtpGen: false,
  isLoading: false,
  error: null,

  setUser: (user: Record<string, any> | null) => {
    set({ user })
  },

  setToken: (token: string | null) => {
    set({ token })
  },

  setOtpGen: (isOtpGen: boolean) => {
    set({ isOtpGen })
  },

  clearError: () => {
    set({ error: null })
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isOtpGen: false,
      error: null
    })
  }
})

const useUserStore = create<UserState>()(
  devtools(
    persist(userStore, {
      name: 'user-storage'
    })
  )
)

export default useUserStore
