<script setup lang="ts">
import {ref, watch, onMounted, reactive, computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/apiClient/apiClient';
import type {PaginationRequest} from '@/dto/general/PaginationRequest';
import type {StoredItemGetAllDto} from '@/dto/item/StoredItemGetAllDto.ts';
import AddItemModal from "@/components/item/AddItemModal.vue";
import {useUserStore} from "@/stores/UserStore.ts";
import type {ResultDto} from "@/dto/general/ResultDto.ts";
import type {IdAndListDto} from "@/dto/general/IdAndListDto.ts";
import StoredItemDescription from "@/components/Inventory/InventoryInfoTabs/StoredItemDescription.vue";

const props = defineProps<{ inventoryId: string; isCreator: boolean }>();

const win = window;
const userStore = useUserStore();
const {t, locale} = useI18n();
const items = ref<StoredItemGetAllDto[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const hasMore = ref(true);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const showModal = ref(false);
const selectedItemId = ref<string>('');
const expandedItemId = ref<string | null>(null);

const allItemIds = computed(() => items.value.flatMap(group => group.storedItemsId?.map(item => item.id) ?? []));

const isAllSelected = computed(() => allItemIds.value.length > 0 && allItemIds.value.every(id => selectedIds.value.has(id)));

const requestDto = reactive<PaginationRequest>({
  page: 0,
  returnCount: 25,
  inventoryId: props.inventoryId,
  searchValue: null,
});

const deleteDto = reactive<IdAndListDto>({
  id: props.inventoryId,
  values: Array.from(selectedIds.value),
});

watch(() => requestDto.searchValue, () => {
  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    requestDto.page = 0;
    hasMore.value = true;
    loadItems(true);
  }, 500);
});

onMounted(async () => {
  await loadItems();
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    allItemIds.value.forEach(id => selectedIds.value.delete(id));
  } else {
    allItemIds.value.forEach(id => selectedIds.value.add(id));
  }
}

function isGroupSelected(group: StoredItemGetAllDto) {
  const ids = group.storedItemsId?.map(item => item.id) ?? [];
  return ids.length > 0 && ids.every(id => selectedIds.value.has(id));
}

function toggleGroupSelection(group: StoredItemGetAllDto) {
  const ids = group.storedItemsId?.map(item => item.id) ?? [];
  if (isGroupSelected(group)) {
    ids.forEach(id => selectedIds.value.delete(id));
  } else {
    ids.forEach(id => selectedIds.value.add(id));
  }
}

function toggleSelection(id: string) {
  selectedIds.value.has(id) ? selectedIds.value.delete(id) : selectedIds.value.add(id);
}

async function handleScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
    await loadItems();
  }
}

async function loadItems(reset = false) {
  if (!hasMore.value) return;

  if (reset) {
    requestDto.page = 0;
    items.value = [];
    hasMore.value = true;
  }

  try {
    const response = await apiClient.get<StoredItemGetAllDto[]>('/api/StoredItems/get', requestDto);
    const data = response.data ?? [];

    const totalItemCount = data.reduce((sum, group) => sum + (group.storedItemsId?.length || 0), 0);
    if (totalItemCount < requestDto.returnCount) hasMore.value = false;

    items.value.push(...data);
    requestDto.page++;
  } catch (err) {
    console.error(err);
  }
}

async function deleteSelectedItems() {
  if (selectedIds.value.size === 0) return;

  try {
    const response = await apiClient.delete<ResultDto | null>('/api/StoredItems/delete', null, {
      id: props.inventoryId,
      values: Array.from(selectedIds.value)
    });

    if (response.data) {
      alert(response.data.error)
    } else {
      await loadItems(true)
      selectedIds.value.clear();
    }
  } catch (err) {
    console.error(err);
  }
}

function openModal(group: StoredItemGetAllDto) {
  selectedItemId.value = group.itemId;
  showModal.value = true;
}

function toggleDetails(itemId: string) {
  expandedItemId.value = expandedItemId.value === itemId ? null : itemId;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="d-flex btn-group align-items-center mb-2">
    <button v-if="isCreator || userStore.hasAdminRights"
            class="btn btn-outline-danger btn-md"
            :disabled="selectedIds.size === 0"
            @click="deleteSelectedItems"
            :title="t('inventoryInfo.storedItemsTab.deleteSelectedTitle')">
      <i class="bi bi-trash"></i>
    </button>
    <input type="text"
           v-model="requestDto.searchValue"
           class="form-control form-control-md"
           :placeholder="t('inventoryInfo.storedItemsTab.searchPlaceholder')"/>
  </div>
  <div style="max-height: 70vh; overflow-y: auto;" @scroll="handleScroll">
    <div class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="sticky-top table-light">
        <tr>
          <th style="width: 2rem">
            <input v-if="isCreator || userStore.hasAdminRights"
                   type="checkbox"
                   :checked="isAllSelected"
                   @change="toggleSelectAll"/>
          </th>
          <th>{{ t('inventoryInfo.storedItemsTab.table.header.item') }}</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="group in items" :key="group.itemName">
          <tr class="table-light">
            <td>
              <input v-if="isCreator || userStore.hasAdminRights"
                     type="checkbox"
                     :checked="isGroupSelected(group)"
                     @change="toggleGroupSelection(group)"/>
            </td>
            <td class="d-flex justify-content-between align-items-center">
              <strong>{{ group.itemName }}</strong>
              <button class="btn btn-sm btn-outline-primary"
                      @click="openModal(group)"
                      :title="t('inventoryInfo.storedItemsTab.addItemTitle')">
                {{ t('inventoryInfo.storedItemsTab.addItemButton') }}
              </button>
            </td>
          </tr>
          <template v-for="item in group.storedItemsId" :key="item.id">
            <tr class="table-secondary">
              <td>
                <input v-if="isCreator || userStore.hasAdminRights"
                       type="checkbox"
                       :checked="selectedIds.has(item.id)"
                       @change="toggleSelection(item.id)"/>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-center">
                    <strong>{{ item.customId?.trim() || item.id }}</strong>
                    <button class="btn btn-sm btn-outline-info" @click="toggleDetails(item.id)">
                      {{ expandedItemId === item.id ? 'Hide' : 'Details' }}
                    </button>
                  </div>
                  <div class="text-muted small">
                    {{ formatDate(item.createdAt) }}
                    <a class="text-decoration-none"
                       @click="win.open(`/user/${item.creatorId}`, '_blank')"
                       style="cursor: pointer">
                      {{ item.creatorName }}
                    </a>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="expandedItemId === item.id">
              <td></td>
              <td colspan="1">
                <StoredItemDescription :inventoryId="props.inventoryId" :storedItemId="item.id"/>
              </td>
            </tr>
          </template>
          <tr v-if="!group.storedItemsId?.length">
            <td colspan="2" class="text-danger">
              {{ t('inventoryInfo.storedItemsTab.table.noItems') }}
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>

  <AddItemModal v-if="showModal"
                :inventoryId="inventoryId"
                :itemId="selectedItemId"
                @close="showModal = false"
                @loadItems="loadItems(true)"/>
</template>

<style scoped>

</style>
