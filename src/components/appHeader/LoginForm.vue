<script setup lang="ts">
import {ref} from 'vue';
import {useJwtStore} from '@/stores/JwtStore';
import {apiClient} from "@/services/apiClient.ts";
import type {LoginDto} from "@/dto/user/LoginDto.ts";
import type {ResultDtoGeneric} from "@/dto/general/ResultDto.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import type {AppUserGetDto} from "@/dto/user/AppUserGetDto.ts";
import {useI18n} from "vue-i18n";

const { t } = useI18n();
const jwtStore = useJwtStore();
const userStore = useUserStore();
const errorMessage = ref('');
const dto = ref<LoginDto>({
  emailOrUserName: "",
  password: "",
});

async function login() {
  try {
    const response = await apiClient.post<ResultDtoGeneric<string>>('/api/Authentication/sign-in', dto.value);

    if (response.data.isSucceeded) {
      jwtStore.setToken(response.data.data!);

      await setCurrentUser();

      dto.value.emailOrUserName = "";
      dto.value.password = "";
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Login failed. Please try again.');
  }
}

async function setCurrentUser() {
  try {
    const response = await apiClient.get<AppUserGetDto | null>('/api/UserOperations/get-my-info', null);

    if (response.data !== null) {
      userStore.setUser(response.data);
    } else {
      jwtStore.clearToken();
      errorMessage.value = 'Failed to load user info';
    }
  } catch (err: any) {
    errorMessage.value =
        err.response?.data?.message || 'Error fetching user info';
  }
}
</script>

<template>
  <form @submit.prevent="login" class="p-3" style="min-width: 250px;">
    <div class="mb-2">
      <input
          v-model="dto.emailOrUserName"
          type="email"
          class="form-control"
          :placeholder="t('auth.emailOrUserName')"
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
  </form>
</template>

<style scoped>

</style>