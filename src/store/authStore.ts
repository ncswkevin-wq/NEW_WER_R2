import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  userId: string;
  userName: string;
  deptCode: string;
  authCode: string;
}

interface AuthState {
  user: UserInfo | null;
  login: (user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'erp-auth' }
  )
);
