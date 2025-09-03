<script setup lang="ts">
import {RouterLink, useRoute} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {computed, ref} from 'vue';
import {useJwtStore} from '@/stores/JwtStore';
import {useUserStore} from '@/stores/UserStore';
import LoginForm from "@/components/appHeader/LoginForm.vue";
import RegisterForm from "@/components/appHeader/RegisterForm.vue";

const {t, locale} = useI18n();
const route = useRoute();
const jwtStore = useJwtStore();
const userStore = useUserStore();
const activeForm = ref<'login' | 'register'>('login');

const user = computed(() => userStore.getUser);
const isAuthenticated = computed(() => jwtStore.isAnyToken() && jwtStore.isTokenValid());
const currentLang = computed(() => locale.value);

function setLang(lang: 'en' | 'ru') {
  locale.value = lang;
}

function logout() {
  jwtStore.clearToken();
  userStore.clearUser();
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light px-3">
    <div class="container-fluid">
      <ul class="nav nav-tabs me-auto">
        <li class="nav-item">
          <RouterLink
              class="nav-link"
              :class="{ active: route.path === '/' }"
              to="/">
            {{ t('nav.inventories') }}
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink
              class="nav-link"
              :class="{ active: route.path.startsWith('/users') }"
              to="/users">
            {{ t('nav.users') }}
          </RouterLink>
        </li>
      </ul>


      <div class="d-flex align-items-center">
        <div class="btn-group me-3">
          <button
              type="button"
              class="btn btn-outline-secondary btn-md"
              :class="{ active: currentLang === 'en' }"
              @click="setLang('en')">
            {{ t('nav.lang.en') }}
          </button>
          <button
              type="button"
              class="btn btn-outline-secondary btn-md"
              :class="{ active: currentLang === 'ru' }"
              @click="setLang('ru')">
            {{ t('nav.lang.ru') }}
          </button>
        </div>
        <div class="dropdown">
          <button
              class="btn btn-outline-secondary dropdown-toggle"
              type="button"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false">
            <i class="bi bi-person-circle"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end p-2 position-absolute"
              style="z-index: 1080;"
              aria-labelledby="userMenuButton">
            <template v-if="isAuthenticated && user">
              <li class="dropdown-item-text fw-bold">{{ user.name }}</li>
              <li class="dropdown-item-text">{{ user.userName }}</li>
              <li class="dropdown-item-text">{{ user.email }}</li>
              <li>
                <hr class="dropdown-divider"/>
              </li>
              <li>
                <RouterLink
                    class="dropdown-item"
                    :to="`/user/${user.id}`">
                  {{ t('nav.profile') }}
                </RouterLink>
              </li>
              <li>
                <button class="dropdown-item text-danger" @click="logout">
                  {{ t('nav.logout') }}
                </button>
              </li>
            </template>
            <template v-else>
              <li @click.stop>
                <component :is="activeForm === 'login' ? LoginForm : RegisterForm"/>
              </li>
              <li class="text-center small mt-2" @click.stop>
                <span v-if="activeForm === 'login'">
                  {{ t('nav.areYouNew') }}
                  <a href="#" @click.prevent="activeForm = 'register'">{{ t('nav.register') }}</a>
                </span>
                <span v-else>
                  {{ t('nav.haveAccount') }}
                  <a href="#" @click.prevent="activeForm = 'login'">{{ t('nav.login') }}</a>
                </span>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>

</style>