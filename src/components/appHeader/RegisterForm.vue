<script setup lang="ts">
import {ref} from 'vue';
import {apiClient} from "@/apiClient/apiClient.ts";
import type {AppUserGetDto} from "@/dto/user/AppUserGetDto.ts";
import type {RegistrationDto} from "@/dto/user/RegistrationDto.ts";
import type {ResultDtoGeneric} from "@/dto/general/ResultDto.ts";
import {useJwtStore} from "@/stores/JwtStore.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const jwtStore = useJwtStore();
const userStore = useUserStore();
const dto = ref<RegistrationDto>({
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  password: ''
});

async function register() {
  try {
    const response = await apiClient.post<ResultDtoGeneric<string>>(
        '/api/Authentication/sign-up',
        dto.value
    );

    if (response.data.isSucceeded && response.data.data) {
      jwtStore.setToken(response.data.data);
      await setCurrentUser();

      dto.value.firstName = '';
      dto.value.lastName = '';
      dto.value.userName = '';
      dto.value.email = '';
      dto.value.password = '';
    } else if (!response.data.isSucceeded) {
      alert(response.data.error)
    }
  } catch (err) {
    console.error(err);
  }
}

async function setCurrentUser() {
  try {
    const response = await apiClient.get<AppUserGetDto | null>('/api/UserOperations/get-my-info', null);

    if (response.data !== null) {
      userStore.setUser(response.data);
    } else {
      jwtStore.clearToken();
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <form @submit.prevent="register" class="p-3" style="min-width: 250px;">
    <div class="mb-2">
      <input
          v-model="dto.firstName"
          type="text"
          class="form-control"
          :placeholder="t('auth.firstName')"
          required/>
    </div>
    <div class="mb-2">
      <input
          v-model="dto.lastName"
          type="text"
          class="form-control"
          :placeholder="t('auth.lastName')"
          required/>
    </div>
    <div class="mb-2">
      <input
          v-model="dto.userName"
          type="text"
          class="form-control"
          :placeholder="t('auth.userName')"
          required/>
    </div>
    <div class="mb-2">
      <input
          v-model="dto.email"
          type="email"
          class="form-control"
          :placeholder="t('auth.email')"
          required/>
    </div>
    <div class="mb-2">
      <input
          v-model="dto.password"
          type="password"
          class="form-control"
          :placeholder="t('auth.password')"
          required/>
    </div>
    <button type="submit" class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2">
      <i class="bi bi-person-plus-fill"></i>
      {{ t('auth.register') }}
    </button>
  </form>
</template>

<style scoped>

</style>