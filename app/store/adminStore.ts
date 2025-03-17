import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminState, ADMIN_CREDENTIALS } from '../lib/adminConfig';

interface AdminStore extends AdminState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,

      login: (username: string, password: string) => {
        if (
          username === ADMIN_CREDENTIALS.username &&
          password === ADMIN_CREDENTIALS.password
        ) {
          set({ isAuthenticated: true, username });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, username: null });
      },
    }),
    {
      name: 'admin-storage',
    }
  )
);