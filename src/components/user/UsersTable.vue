<script setup lang="ts">
import {ref, onMounted, watch, reactive} from 'vue';
import {apiClient} from '@/apiClient/apiClient.ts';
import type {AppUserGetDto} from '@/dto/user/AppUserGetDto.ts';
import type {UserRequestDto} from '@/dto/user/UserRequestDto.ts';
import type {ResultDto} from '@/dto/general/ResultDto.ts';
import {useUserStore} from '@/stores/UserStore.ts';
import {useJwtStore} from '@/stores/JwtStore.ts';
import type {ChangeUsersStatusDto} from "@/dto/user/ChangeUsersStatusDto.ts";
import {useI18n} from "vue-i18n";

const props = defineProps<{ inventoryId: string | null; isIncluded: boolean; }>();

const {t} = useI18n();
const win = window;
const jwtStore = useJwtStore();
const userStore = useUserStore();
const users = ref<AppUserGetDto[]>([]);
const selectedIds = ref(new Set<string>());
const allSelected = ref(false);
const hasMore = ref(true);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const dto = reactive<UserRequestDto>({
  page: 0,
  returnCount: 25,
  searchValue: null,
  isIncluded: props.isIncluded,
  inventoryId: props.inventoryId,
});

onMounted(async () => {
  await loadUsers(false);
});

watch(
    () => dto.searchValue,
    () => {
      if (timer.value) clearTimeout(timer.value);
      timer.value = setTimeout(async () => {
        dto.page = 0;
        hasMore.value = true;
        await loadUsers(true);
      }, 500);
    }
);

async function loadUsers(reset = false) {
  if (!hasMore.value) return;

  if (reset) {
    dto.page = 0;
    users.value = [];
    hasMore.value = true;
  }

  try {
    const response = await apiClient.get<AppUserGetDto[]>('/api/UserOperations/get-all', dto);

    if (response.data.length < dto.returnCount) hasMore.value = false;

    users.value = [...response.data];
    dto.page++;
  } catch (err) {
    console.error(err);
  }
}

function toggleSelectAll() {
  allSelected.value = !allSelected.value;
  selectedIds.value.clear();
  if (allSelected.value) {
    users.value.forEach(user => selectedIds.value.add(user.id));
  }
}

function toggleSelection(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  allSelected.value = selectedIds.value.size === users.value.length;
}

async function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
    await loadUsers(false);
  }
}

async function changeUserStatus(requestedStatus: boolean, roleName: string | null) {
  if (selectedIds.value.size === 0 || !userStore.hasAdminRights) return;

  const dto: ChangeUsersStatusDto = {
    requestedStatus: requestedStatus,
    userIds: Array.from(selectedIds.value),
    roleName: roleName
  };

  const endpoint = roleName === null ? '/api/UserOperations/change-users-blocking-status' : '/api/UserOperations/change-users-role-status';

  try {
    const response = await apiClient.post<ResultDto | null>(endpoint, dto);

    if (!response.data) {
      selectedIds.value.clear();
      allSelected.value = false;
      await loadUsers(true);
      await setCurrentUser();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteSelectedUsers() {
  if (selectedIds.value.size === 0) return;

  try {
    const response = await apiClient.delete<ResultDto | null>('/api/UserOperations/delete-selected', null, {userIds: Array.from(selectedIds.value)});

    if (response.data) {
      alert(response.data.error);
    } else {
      users.value = users.value.filter(user => !selectedIds.value.has(user.id));
      selectedIds.value.clear();
      allSelected.value = false;
      await loadUsers(true);
      await setCurrentUser();
    }
  } catch (err) {
    console.error(err);
  }
}

async function changeUserInventoryStatus(isAllowed: boolean) {
  if (!props.inventoryId || selectedIds.value.size === 0)
    return;

  const dto = {
    id: props.inventoryId,
    values: Array.from(selectedIds.value),
  };

  const endpoint = isAllowed ? '/api/InventoryEditors/add' : '/api/InventoryEditors/delete';

  try {
    const response = isAllowed ? await apiClient.post<ResultDto | null>(endpoint, dto) : await apiClient.delete<ResultDto | null>(endpoint, null, dto);

    if (!response.data) {
      selectedIds.value.clear();
      allSelected.value = false;
      await loadUsers(true);
    } else {
      alert(response.data?.error);
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
      userStore.clearUser();
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex justify-content-between align-items-center mb-4 gap-3">
      <div v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid() && userStore.hasAdminRights" class="btn-group">
        <template v-if="!props.inventoryId">
          <button type="button"
                  class="btn btn-outline-primary btn-md"
                  :title="t('users.buttons.unblock')"
                  @click="changeUserStatus(false, null)">
            <i class="bi bi-unlock"></i>
          </button>
          <button type="button"
                  class="btn btn-outline-danger btn-md"
                  :title="t('users.buttons.block')"
                  @click="changeUserStatus(true, null)">
            <i class="bi bi-lock"></i>
          </button>
          <button type="button"
                  class="btn btn-outline-primary btn-md"
                  :title="t('users.buttons.addAdmin')"
                  @click="changeUserStatus(true, 'admin')">
            <i class="bi bi-person-plus"></i>
          </button>
          <button type="button"
                  class="btn btn-outline-danger btn-md"
                  :title="t('users.buttons.removeAdmin')"
                  @click="changeUserStatus(false, 'admin')">
            <i class="bi bi-person-dash"></i>
          </button>
          <button type="button"
                  class="btn btn-outline-danger btn-md"
                  :title="t('users.buttons.deleteUsers')"
                  @click="deleteSelectedUsers">
            <i class="bi bi-trash"></i>
          </button>
        </template>
        <template v-else>
          <button type="button"
                  class="btn btn-outline-success btn-md"
                  v-if="props.isIncluded"
                  :title="t('users.buttons.removeFromInventory')"
                  @click="changeUserInventoryStatus(false)">
            <i class="bi bi-box-arrow-left"></i>
          </button>
          <button type="button"
                  class="btn btn-outline-primary btn-md"
                  v-else
                  :title="t('users.buttons.addToInventory')"
                  @click="changeUserInventoryStatus(true)">
            <i class="bi bi-box-arrow-in-right"></i>
          </button>
        </template>
      </div>
      <input
          v-model="dto.searchValue"
          type="text"
          class="form-control form-control-md flex-grow-1"
          :placeholder="t('users.search.placeholder')"/>
    </div>

    <div class="overflow-auto border" style="max-height: 80vh;" @scroll="onScroll">
      <table class="table table-sm table-hover mb-0">
        <thead class="table-light sticky-top">
        <tr>
          <th v-if="userStore.hasAdminRights">
            <input type="checkbox"
                   :checked="allSelected"
                   @change="toggleSelectAll"/>
          </th>
          <th>{{ t('users.table.name') }}</th>
          <th>{{ t('users.table.username') }}</th>
          <th v-if="!props.inventoryId">{{ t('users.table.email') }}</th>
          <th v-if="!props.inventoryId">{{ t('users.table.blocked') }}</th>
          <th v-if="!props.inventoryId">{{ t('users.table.admin') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="user in users"
            :key="user.id"
            @click="win.open(`/user/${user.id}`, '_blank')"
            style="cursor: pointer">
          <td v-if="userStore.hasAdminRights" @click.stop>
            <input
                type="checkbox"
                :checked="selectedIds.has(user.id)"
                @change="() => toggleSelection(user.id)"/>
          </td>
          <td>{{ user.name }}</td>
          <td>{{ user.userName }}</td>
          <td v-if="!props.inventoryId">{{ user.email }}</td>
          <td v-if="!props.inventoryId">{{ user.isBlocked ? 'Yes' : 'No' }}</td>
          <td v-if="!props.inventoryId">{{ user.isAdmin ? 'Yes' : 'No' }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>

</style>