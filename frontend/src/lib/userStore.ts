/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface UserStore {
  currentUser: User | null;
  isLoading: boolean;
  fetchUserInfo: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  isLoading: true,
  
  fetchUserInfo: async (id) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (!id) return set({ currentUser: null, isLoading: false });

    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`);
      const data: User = await response.json();

      if (response.ok) {
        set({ currentUser: data, isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.log(err);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
