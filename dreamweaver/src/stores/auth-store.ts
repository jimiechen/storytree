import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Methods
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user }),
      
      setToken: (token) => set({ token }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      login: (token, user) => {
        set({
          user,
          token,
          error: null,
          isLoading: false
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
          isLoading: false
        });
      },
      
      updateUser: (userUpdates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userUpdates }
          });
        }
      },
      
      isAuthenticated: () => {
        return get().token !== null && get().user !== null;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);
