import {createApp} from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import {createPinia} from "pinia";
import i18n from "@/i18n";
import {useJwtStore} from "@/stores/JwtStore.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(i18n)

router.beforeEach((to, from, next) => {
    const jwtStore = useJwtStore();
    const userStore = useUserStore();

    if (to.meta.requiresAuth) {
        if (!jwtStore.isAnyToken() || !jwtStore.isTokenValid()) {
            jwtStore.clearToken();
            userStore.clearUser();
            return next('/');
        }
    }

    next();
});

app.mount('#app')
