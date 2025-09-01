import {defineStore} from 'pinia';
import type {AppUserGetDto} from "@/dto/user/AppUserGetDto.ts";

export const useUserStore = defineStore('userStore', {
    state: () => ({
        user: null as AppUserGetDto | null
    }),
    getters: {
        hasAdminRights: (state) => state.user?.isAdmin,
        getUser: (state) => state.user,
    },
    actions: {
        setUser(user: AppUserGetDto) {
            this.user = user;
        },
        clearUser() {
            this.user = null;
        },
    }
});

