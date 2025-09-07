<script setup lang="ts">
import {ref, onMounted, reactive} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/apiClient/apiClient';
import type {AppUserGetDto} from '@/dto/user/AppUserGetDto';
import type {ChangeUsersStatusDto} from '@/dto/user/ChangeUsersStatusDto';
import type {ResultDto, ResultDtoGeneric} from '@/dto/general/ResultDto';
import InventoriesTable from '@/components/Inventory/InventoriesTable.vue';
import {useUserStore} from '@/stores/UserStore';
import {useJwtStore} from '@/stores/JwtStore';
import router from "@/router";
import type {UpdateUserMainInfoDto} from "@/dto/user/UpdateUserMainInfoDto.ts";

const props = defineProps<{ id: string }>();

const {t} = useI18n();
const userStore = useUserStore();
const jwtStore = useJwtStore();
const activeTab = ref<'info' | 'inventories'>('info');
const user = ref<AppUserGetDto>();
const isEditing = ref(false);

onMounted(async () => {
  await loadUser();
});

const updateMainInfoDto = reactive<UpdateUserMainInfoDto>({
  id: props.id,
  fullName: '',
  userName: '',
  email: '',
  concurrencyStamp: ''
});

async function loadUser() {
  try {
    const response = await apiClient.get<ResultDtoGeneric<AppUserGetDto>>(`/api/UserOperations/get-by-id/`, {userId: props.id});

    if (!response.data.isSucceeded) {
      alert(response.data.error)
      await router.push('/users');
    }

    user.value = response.data!.data!;

    updateMainInfoDto.fullName = response.data!.data!.name;
    updateMainInfoDto.userName = response.data!.data!.userName;
    updateMainInfoDto.email = response.data!.data!.email;
    updateMainInfoDto.concurrencyStamp = response.data!.data!.concurrencyStamp;
  } catch (err) {
    console.error(err);
  }
}

async function changeUserStatus(requestedStatus: boolean, roleName: string | null) {
  if (!userStore.hasAdminRights) return;

  const dto: ChangeUsersStatusDto = {
    requestedStatus: requestedStatus,
    userIdAndStamp: [{
      id: props.id,
      value: user.value!.concurrencyStamp
    }],
    roleName: roleName
  };

  const endpoint = roleName === null ? '/api/UserOperations/change-users-blocking-status' : '/api/UserOperations/change-users-role-status';

  try {
    const response = await apiClient.post<ResultDto>(endpoint, dto);
    if (!response.data.isSucceeded) {
      alert(response.data.error);
    } else {
      await loadUser();
    }
  } catch (err) {
    console.error(err);
  }
}

function switchEditing() {
  if (!user.value) return;
  isEditing.value = !isEditing.value;
}

async function submitUserInfoUpdate() {
  if (!userStore.hasAdminRights || !user.value) return;

  try {
    const response = await apiClient.post<ResultDto>('/api/UserOperations/update-main-info', updateMainInfoDto);
    if (!response.data.isSucceeded) {
      alert(response.data.error);
    } else {
      isEditing.value = false;
      await loadUser();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser() {
  if (!userStore.hasAdminRights)
    return;

  try {
    const response = await apiClient.delete<ResultDto>('/api/UserOperations/delete-selected', null, {userIds: [props.id]});

    if (!response.data.isSucceeded) {
      alert(response.data.error);
    } else {
      await loadUser();
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="container py-4">
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          {{ t('user.tabs.info') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'inventories' }" @click="activeTab = 'inventories'">
          {{ t('user.tabs.inventories') }}
        </button>
      </li>
    </ul>
    <div v-if="activeTab === 'info'">
      <div v-if="user" class="card">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h5 class="card-title mb-0">
              <template v-if="isEditing">
                <input v-model="updateMainInfoDto.fullName" class="form-control form-control-m"/>
              </template>
              <template v-else>
                {{ user.name }}
              </template>
            </h5>
            <div class="btn-group">
              <button v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights"
                      type="button"
                      class="btn btn-outline-secondary btn-md"
                      :title="t('users.buttons.editUser')"
                      @click="switchEditing">
                <i class="bi bi-pencil"></i>
              </button>
              <button v-if="isEditing"
                      type="button"
                      class="btn btn-outline-success btn-md"
                      :title="t('users.buttons.saveUser')"
                      @click="submitUserInfoUpdate">
                <i class="bi bi-check-lg"></i>
              </button>
              <button v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights"
                      type="button"
                      class="btn btn-outline-danger btn-md"
                      :title="t('users.buttons.deleteUsers')"
                      @click="deleteUser">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="d-flex align-items-center mb-2">
            <strong>{{ t('user.fields.username') }}:</strong>
            <template v-if="isEditing">
              <input v-model="updateMainInfoDto.userName" class="form-control form-control-md ms-2"/>
            </template>
            <template v-else>
              {{ user.userName }}
            </template>
          </div>
          <div class="d-flex align-items-center mb-2">
            <strong>{{ t('user.fields.email') }}:</strong>
            <template v-if="isEditing">
              <input v-model="updateMainInfoDto.email" class="form-control form-control-md ms-2"/>
            </template>
            <template v-else>
              {{ user.email }}
            </template>
          </div>
          <div class="d-flex align-items-center mb-2">
            <div v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights" class="btn-group">
              <button
                  v-if="user.isBlocked"
                  type="button"
                  class="btn btn-outline-primary btn-sm me-2"
                  :title="t('users.buttons.unblock')"
                  @click="changeUserStatus(false, null)">
                <i class="bi bi-unlock"></i>
              </button>
              <button
                  v-if="!user.isBlocked"
                  type="button"
                  class="btn btn-outline-danger btn-sm me-2"
                  :title="t('users.buttons.block')"
                  @click="changeUserStatus(true, null)">
                <i class="bi bi-lock"></i>
              </button>
            </div>
            <p class="card-text mb-0">
              <strong>{{ t('user.fields.status') }}: </strong>
              <span :class="user.isBlocked ? 'text-danger' : 'text-success'">
                {{ user.isBlocked ? t('user.status.blocked') : t('user.status.active') }}
              </span>
            </p>
          </div>
          <div class="d-flex align-items-center mb-2">
            <div v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights" class="btn-group">
              <button
                  v-if="!user.isAdmin"
                  type="button"
                  class="btn btn-outline-primary btn-sm me-2"
                  :title="t('users.buttons.addAdmin')"
                  @click="changeUserStatus(true, 'admin')">
                <i class="bi bi-person-plus"></i>
              </button>
              <button
                  v-if="user.isAdmin"
                  type="button"
                  class="btn btn-outline-danger btn-sm me-2"
                  :title="t('users.buttons.removeAdmin')"
                  @click="changeUserStatus(false, 'admin')">
                <i class="bi bi-person-dash"></i>
              </button>
            </div>
            <p class="card-text mb-0">
              <strong>{{ t('user.fields.role') }}:</strong>
              {{ user.isAdmin ? t('user.roles.admin') : t('user.roles.user') }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="activeTab === 'inventories'" class="row g-3">
      <div class="col-md-6">
        <h6 class="fw-bold mb-2">{{ t('user.tables.created') }}</h6>
        <InventoriesTable :userId="props.id" :isCreator="true"/>
      </div>
      <div class="col-md-6">
        <h6 class="fw-bold mb-2">{{ t('user.tables.viewed') }}</h6>
        <InventoriesTable :userId="props.id" :isCreator="false"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>