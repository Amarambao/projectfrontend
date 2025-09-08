<script setup lang="ts">
import {ref, watch, onMounted, reactive, computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/apiClient/apiClient';
import type {PaginationRequest} from '@/dto/general/PaginationRequest';
import type {StoredItemGetAllDto} from '@/dto/item/StoredItemGetAllDto';
import type {ResultDto} from '@/dto/general/ResultDto';
import type {IdAndStringDto} from '@/dto/general/IdAndStringDto';
import AddItemModal from '@/components/item/AddItemModal.vue';
import StoredItemDescription from '@/components/Inventory/InventoryInfoTabs/StoredItemDescription.vue';
import {useUserStore} from '@/stores/UserStore';

const props = defineProps<{ inventoryId: string; isCreator: boolean }>();

const {t, locale} = useI18n();
const win = window;
const userStore = useUserStore();

const items = ref<StoredItemGetAllDto[]>([]);
const itemTypes = ref<IdAndStringDto[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const hasMore = ref(true);
const isEmpty = ref(false);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const showModal = ref(false);
const selectedItemId = ref<string>('');
const expandedItemId = ref<string | null>(null);

const requestDto = reactive<PaginationRequest>({
  page: 0,
  returnCount: 25,
  inventoryId: props.inventoryId,
  searchValue: null,
});

watch(() => requestDto.searchValue, () => {
  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    requestDto.page = 0;
    hasMore.value = true;
    loadItems(true);
  }, 500);
});

onMounted(() => loadItems());

const allItemIds = computed(() =>
    items.value.flatMap(group => group.storedItemsId?.map(item => item.id) ?? [])
);

const isAllSelected = computed(() =>
    allItemIds.value.length > 0 && allItemIds.value.every(id => selectedIds.value.has(id))
);

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
  if (!hasMore.value && !reset) return;

  if (reset) {
    requestDto.page = 0;
    hasMore.value = true;
    items.value = [];
    isEmpty.value = false;
  }

  try {
    const response = await apiClient.get<StoredItemGetAllDto[]>('/api/StoredItems/get', requestDto);
    const data = response.data ?? [];

    const totalItemCount = data.reduce((sum, group) => sum + (group.storedItemsId?.length || 0), 0);
    if (totalItemCount < requestDto.returnCount) hasMore.value = false;

    if (data.length > 0) {
      items.value = reset ? [...data] : [...items.value, ...data];
      requestDto.page++;
    }

    if (data.length === 0 && requestDto.page === 0) {
      isEmpty.value = true;
      await loadInventoryItems();
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadInventoryItems() {
  try {
    const response = await apiClient.get<IdAndStringDto[]>('/api/ItemType/get-by-inventory-id', {
      inventoryId: props.inventoryId,
    });
    itemTypes.value = [...response.data];
  } catch (err) {
    console.error(err);
  }
}

async function deleteSelectedItems() {
  if (selectedIds.value.size === 0) return;

  try {
    const response = await apiClient.delete<ResultDto | null>('/api/StoredItems/delete', null, {
      id: props.inventoryId,
      values: Array.from(selectedIds.value),
    });

    if (response.data) {
      alert(response.data.error);
    } else {
      await loadItems(true);
      selectedIds.value.clear();
    }
  } catch (err) {
    console.error(err);
  }
}

function openModal(itemTypeId: string) {
  selectedItemId.value = itemTypeId;
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
    <button v-if="props.isCreator || userStore.hasAdminRights"
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
            <input v-if="props.isCreator || userStore.hasAdminRights"
                   type="checkbox"
                   :checked="isAllSelected"
                   @change="toggleSelectAll"/>
          </th>
          <th>{{ t('inventoryInfo.storedItemsTab.table.header.item') }}</th>
        </tr>
        </thead>
        <tbody>
        <template v-if="!isEmpty">
          <template v-for="group in items" :key="group.itemName">
            <tr class="table-light">
              <td>
                <input v-if="props.isCreator || userStore.hasAdminRights"
                       type="checkbox"
                       :checked="isGroupSelected(group)"
                       @change="toggleGroupSelection(group)"/>
              </td>
              <td class="d-flex justify-content-between align-items-center">
                <strong>{{ group.itemName }}</strong>
                <button class="btn btn-sm btn-outline-primary"
                        @click="openModal(group.itemId)"
                        :title="t('inventoryInfo.storedItemsTab.addItemTitle')">
                  {{ t('inventoryInfo.storedItemsTab.addItemButton') }}
                </button>
              </td>
            </tr>
            <template v-for="item in group.storedItemsId" :key="item.id">
              <tr class="table-secondary">
                <td>
                  <input v-if="props.isCreator || userStore.hasAdminRights"
                         type="checkbox"
                         :checked="selectedIds.has(item.id)"
                         @change="toggleSelection(item.id)"/>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center">
                      <strong>{{ item.customId?.trim() || item.id }}</strong>
                      <button class="btn btn-sm btn-outline-info" @click="toggleDetails(item.id)">
                        {{ expandedItemId === item.id ? t('common.hide') : t('common.details') }}
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
                <td>
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
        </template>
        <template v-else>
          <tr v-for="type in itemTypes" :key="type.id">
            <td></td>
            <td class="d-flex justify-content-between align-items-center">
              <strong>{{ type.value }}</strong>
              <button class="btn btn-sm btn-outline-primary"
                      @click="openModal(type.id)"
                      :title="t('inventoryInfo.storedItemsTab.addItemTitle')">
                {{ t('inventoryInfo.storedItemsTab.addItemButton') }}
              </button>
            </td>
          </tr>
          <tr v-if="itemTypes.length === 0">
            <td></td>
            <td class="text-muted">
              {{ t('inventoryInfo.storedItemsTab.noItemTypes') }}
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>

  <AddItemModal v-if="showModal"
                :inventoryId="props.inventoryId"
                :itemId="selectedItemId"
                @close="showModal = false"
                @loadItems="loadItems(true)"/>
</template>

<style scoped>

</style>
