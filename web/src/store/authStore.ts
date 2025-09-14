import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, AuthData } from '@/types/user';
import { authAPI } from '@/api/auth';
import { TOKEN_KEY } from '@/utils/constants';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  auth: (data: AuthData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: localStorage.getItem(TOKEN_KEY),
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);
          const { token, user } = response.data;
          
          localStorage.setItem(TOKEN_KEY, token);
          set({ 
            isAuthenticated: true, 
            user, 
            token, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '登录失败' 
          });
          throw error;
        }
      },

      auth: async (data: AuthData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.auth(data);
          const { token, user } = response.data;
          
          localStorage.setItem(TOKEN_KEY, token);
          set({ 
            isAuthenticated: true, 
            user, 
            token, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '认证失败' 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null, 
          error: null 
        });
      },

      checkAuth: async () => {
        const token = get().token || localStorage.getItem(TOKEN_KEY);
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        set({ isLoading: true });
        
        try {
          const response = await authAPI.getCurrentUser();
          const user = response.data;
          set({ 
            isAuthenticated: true, 
            user, 
            token,
            isLoading: false,
            error: null
          });
          return true;
        } catch (error) {
          // 清除认证状态，但不重复清除 localStorage（已在 client.ts 中处理）
          set({ 
            isAuthenticated: false, 
            user: null, 
            token: null, 
            isLoading: false,
            error: error instanceof Error ? error.message : '认证失败'
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user: user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
