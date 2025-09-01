import {defineStore} from 'pinia';

export const useJwtStore = defineStore("jwtStore", {
    state: () => ({
        token: null as string | null,
        tokenDateTime: null as Date | null
    }),
    actions: {
        setToken(newToken: string) {
            this.token = newToken;
            this.tokenDateTime = new Date();
        },
        clearToken() {
            this.token = null;
            this.tokenDateTime = null;
        },
        isAnyToken(): boolean {
            return this.token !== null;
        },
        isTokenValid(): boolean {
            if (!this.tokenDateTime) return false;
            const tokenExpirationTime = new Date(this.tokenDateTime);
            tokenExpirationTime.setHours(tokenExpirationTime.getMinutes() + 30);
            return new Date() < tokenExpirationTime;
        },
    },
});