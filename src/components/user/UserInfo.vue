<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient';
import type {AppUserGetDto} from '@/dto/user/AppUserGetDto';
import type {ChangeUsersStatusDto} from '@/dto/user/ChangeUsersStatusDto';
import type {ResultDto} from '@/dto/general/ResultDto';
import InventoriesTable from '@/components/Inventory/InventoriesTable.vue';
import {useUserStore} from '@/stores/UserStore';
import {useJwtStore} from '@/stores/JwtStore';

const props = defineProps<{ id: string }>();

const {t} = useI18n();
const activeTab = ref<'info' | 'inventories'>('info');
const user = ref<AppUserGetDto | null>(null);
const userStore = useUserStore();
const jwtStore = useJwtStore();

onMounted(() => {
  loadUser();
});

async function loadUser() {
  try {
    const response = await apiClient.get<AppUserGetDto | null>(
        `/api/UserOperations/get-by-id/`,
        {userId: props.id}
    );
    user.value = response.data;
  } catch (err: any) {
    console.error('Failed to load user:', err);
  }
}

async function changeUserStatus(requestedStatus: boolean, roleName: string | null) {
  if (!userStore.hasAdminRights) return;

  const dto: ChangeUsersStatusDto = {
    requestedStatus,
    userIds: [props.id],
    roleName
  };

  const endpoint =
      roleName === null
          ? '/api/UserOperations/change-users-blocking-status'
          : '/api/UserOperations/change-users-role-status';

  try {
    const response = await apiClient.post<ResultDto | null>(endpoint, dto);
    if (response.data?.isSucceeded || response.data === null) {
      await loadUser();
    }
  } catch (err: any) {
    alert(err.response?.data?.message || t('users.alerts.changeStatusError'));
  }
}

async function deleteUser() {
  if (!userStore.hasAdminRights) return;

  try {
    const response = await apiClient.delete<ResultDto>(
        '/api/UserOperations/delete',
        null,
        {userIds: [props.id]}
    );

    if (response.data?.isSucceeded) {
      alert(t('users.alerts.deleted'));
      // Optional: redirect or disable UI
    } else {
      alert(response.data.error || t('users.alerts.deleteFailed'));
    }
  } catch (err: any) {
    alert(err.response?.data?.message || t('users.alerts.deleteError'));
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
            <h5 class="card-title mb-0">{{ user.name }}</h5>
            <button
                v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights"
                type="button"
                class="btn btn-outline-danger btn-sm"
                :title="t('users.buttons.deleteUsers')"
                @click="deleteUser">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <div class="d-flex align-items-center mb-2">
            <strong>{{ t('user.fields.username') }}:</strong> {{ user.userName }}
          </div>
          <div class="d-flex align-items-center mb-2">
            <strong>{{ t('user.fields.email') }}:</strong> {{ user.email }}
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