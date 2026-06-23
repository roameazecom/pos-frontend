import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/auth` 
  : 'http://localhost:5000/api/auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: [], 
      
      login: async (email, password) => {
        try {
          const response = await axios.post(`${API_URL}/login`, { email, password });
          set({ user: response.data.user });
          return response.data.user;
        } catch (error) {
          throw new Error(error.response?.data?.error || 'Invalid email or password');
        }
      },

      logout: () => set({ user: null }),

      fetchUsers: async () => {
        try {
          const response = await axios.get(`${API_URL}/users`);
          set({ users: response.data });
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      },

      addUser: async (newUser) => {
        try {
          const response = await axios.post(`${API_URL}/users`, newUser);
          set((state) => ({ users: [...state.users, response.data] }));
        } catch (error) {
          console.error('Failed to add user', error);
        }
      },
      
      deleteUser: async (id) => {
        try {
          await axios.delete(`${API_URL}/users/${id}`);
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
