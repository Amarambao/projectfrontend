<script setup lang="ts">
import {ref, onMounted, watch, reactive} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient.ts';
import type {InventoryGetLiteDto} from '@/dto/inventory/InventoryGetLiteDto.ts';
import type {InventoryRequestDto} from '@/dto/inventory/InventoryRequestDto.ts';
import type {ResultDto} from '@/dto/general/ResultDto.ts';
import {useUserStore} from '@/stores/UserStore.ts';
import {useJwtStore} from '@/stores/JwtStore.ts';
import InventoryCreateModal from "@/components/Inventory/InventoryCreateModal.vue";

const props = defineProps<{ userId: string | null, isCreator: boolean | null }>();

const {t} = useI18n();
const win = window;
const jwtStore = useJwtStore();
const userStore = useUserStore();
const inventories = ref<InventoryGetLiteDto[]>([]);
const selectedIds = ref(new Set<string>());
const allSelected = ref(false);
const hasMore = ref(true);
const showCreateModal = ref(false);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const dto = reactive<InventoryRequestDto>({
  page: 0,
  returnCount: 25,
  userId: props.userId,
  isCreator: props.isCreator,
  searchValue: null
});

onMounted(() => loadInventories(false));

watch(() => dto.searchValue, () => {
  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    dto.page = 0;
    hasMore.value = true;
    loadInventories(true);
  }, 500);
});

async function loadInventories(reset = false) {
  if (!hasMore.value) return;

  if (reset) {
    dto.page = 0;
    inventories.value = [];
    hasMore.value = true;
  }

  try {
    const response = await apiClient.get<InventoryGetLiteDto[]>('/api/Inventory/get', dto);
    const newItems = response.data || [];

    if (newItems.length < dto.returnCount) hasMore.value = false;

    inventories.value.push(...newItems);
    dto.page++;
  } catch (err) {
    console.log(err);
  }
}

function toggleSelectAll() {
  allSelected.value = !allSelected.value;
  selectedIds.value.clear();
  if (allSelected.value) {
    inventories.value.forEach(inv => selectedIds.value.add(inv.id));
  }
}

function toggleSelection(id: string) {
  selectedIds.value.has(id) ? selectedIds.value.delete(id) : selectedIds.value.add(id);

  allSelected.value = selectedIds.value.size === inventories.value.length;
}

async function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    await loadInventories(false);
  }
}

async function deleteSelectedInventories() {
  if (selectedIds.value.size === 0) return;

  try {
    const response = await apiClient.delete<ResultDto>('/api/Inventory/delete', null, {
      inventoryIds: selectedIds.value
    });

    if (response.data?.isSucceeded) {
      inventories.value = inventories.value.filter(inv => !selectedIds.value.has(inv.id));
      selectedIds.value.clear();
      allSelected.value = false;
    } else {
      alert(t('inventory.alerts.deleteFailed'));
    }
  } catch (err: any) {
    alert(err.response?.data?.message || t('inventory.alerts.deleteError'));
  }
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex justify-content-between align-items-center mb-3 gap-3">
      <div v-if="jwtStore.isAnyToken() && jwtStore.isTokenValid()"
           class="btn-group">
        <button type="button"
                class="btn btn-outline-primary btn-md"
                :title="t('inventory.buttons.create')"
                @click="showCreateModal = true">
          {{ t('inventory.buttons.create') }}
        </button>
        <button v-if="userStore.hasAdminRights || props.isCreator"
                type="button"
                class="btn btn-outline-danger btn-md"
                :title="t('inventory.buttons.deleteSelected')"
                @click="deleteSelectedInventories">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      <input v-model="dto.searchValue"
             type="text"
             class="form-control form-control-md flex-grow-1"
             :placeholder="t('inventory.search.placeholder')"/>
    </div>
    <div class="overflow-auto border" style="max-height: 80vh;" @scroll="onScroll">
      <table class="table table-sm table-hover mb-0">
        <thead class="table-light sticky-top">
        <tr>
          <th v-if="isCreator || userStore.hasAdminRights">
            <input type="checkbox"
                   :checked="allSelected"
                   @change="toggleSelectAll"/>
          </th>
          <th>{{ t('inventory.table.name') }}</th>
          <th>{{ t('inventory.table.items') }}</th>
          <th>{{ t('inventory.table.creator') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="inv in inventories"
            :key="inv.id"
            @click="win.open(`/inventory/${inv.id}`, '_blank')"
            style="cursor: pointer">
          <td v-if="isCreator || userStore.hasAdminRights" @click.stop>
            <input type="checkbox"
                   :checked="selectedIds.has(inv.id)"
                   @change="() => toggleSelection(inv.id)"/>
          </td>
          <td>{{ inv.name }}</td>
          <td>{{ inv.itemsCount }}</td>
          <td>
            <a :href="`/user/${inv.creatorId}`"
               target="_blank"
               @click.stop>
              {{ inv.creatorName }}
            </a>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <InventoryCreateModal
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @created="() => loadInventories(true)"/>
  </div>
</template>

<style scoped>

</style>
