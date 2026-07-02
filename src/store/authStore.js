import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('POS_SERVER_URL');
    if (saved && saved.includes('darkblue-mosquito')) {
      localStorage.setItem('POS_SERVER_URL', 'https://apn.happypiecafe.in');
      return 'https://apn.happypiecafe.in/api/auth';
    }
    const base = saved || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/api/auth`;
  }
  return 'http://localhost:5000/api/auth';
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: [], 
      
      login: async (email, password) => {
        try {
          const response = await axios.post(`${getApiUrl()}/login`, { email, password });
          set({ user: response.data.user });
          return response.data.user;
        } catch (error) {
          throw new Error(error.response?.data?.error || 'Invalid email or password');
        }
      },

      logout: () => set({ user: null }),

      fetchUsers: async () => {
        try {
          const response = await axios.get(`${getApiUrl()}/users`);
          set({ users: response.data });
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      },

      addUser: async (newUser) => {
        try {
          const response = await axios.post(`${getApiUrl()}/users`, newUser);
          set((state) => ({ users: [...state.users, response.data] }));
        } catch (error) {
          console.error('Failed to add user', error);
        }
      },
      
      deleteUser: async (id) => {
        try {
          await axios.delete(`${getApiUrl()}/users/${id}`);
          set((state) => ({ users: state.users.filter(u => u.id !== id) }));
        } catch (error) {
          console.error('Failed to delete user', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
