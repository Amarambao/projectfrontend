<script setup lang="ts">
import {ref, watch, onMounted, reactive, computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient';
import type {PaginationRequest} from '@/dto/general/PaginationRequest';
import type {StoredItemGetAllDto} from '@/dto/item/StoredItemGetAllDto.ts';
import AddItemModal from "@/components/item/AddItemModal.vue";
import type {AddItemDto} from "@/dto/item/AddItemDto.ts";

const props = defineProps<{ inventoryId: string; }>();

const {t} = useI18n();
const items = ref<StoredItemGetAllDto[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const hasMore = ref(true);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const showModal = ref(false);

const allItemIds = computed(() => items.value.flatMap(group => group.itemIds?.map(item => item.id) ?? []));

const isAllSelected = computed(() => allItemIds.value.length > 0 && allItemIds.value.every(id => selectedIds.value.has(id)));

const dto = reactive<PaginationRequest>({
  page: 0,
  returnCount: 25,
  inventoryId: props.inventoryId,
  searchValue: null,
});

const addedItemDto = ref<AddItemDto | null>(null);

watch(() => dto.searchValue, () => {
  if (timer.value) clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    dto.page = 0;
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
  const ids = group.itemIds?.map(item => item.id) ?? [];
  return ids.length > 0 && ids.every(id => selectedIds.value.has(id));
}

function toggleGroupSelection(group: StoredItemGetAllDto) {
  const ids = group.itemIds?.map(item => item.id) ?? [];
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
    dto.page = 0;
    items.value = [];
    hasMore.value = true;
  }

  try {
    const response = await apiClient.get<StoredItemGetAllDto[]>('/api/StoredItems/get', dto);
    const data = response.data ?? [];

    const totalItemCount = data.reduce((sum, group) => sum + (group.itemIds?.length || 0), 0);
    if (totalItemCount < dto.returnCount) hasMore.value = false;

    items.value.push(...data);
    dto.page++;
  } catch (err) {
    console.error('Failed to load stored items:', err);
  }
}

async function deleteSelectedItems() {
  if (selectedIds.value.size === 0) return;

  try {
    await apiClient.delete('/api/StoredItems/delete', {
      params: {
        id: props.inventoryId,
        values: Array.from(selectedIds.value),
      },
    });

    items.value = items.value.map(group => ({
      ...group,
      itemIds: group.itemIds?.filter(item => !selectedIds.value.has(item.id)) ?? [],
    })).filter(group => group.itemIds?.length);

    selectedIds.value.clear();
  } catch (err) {
    console.error('Failed to delete selected items:', err);
  }
}

async function addItemToGroup(group: StoredItemGetAllDto) {
  try {
    const addItemDto = reactive<AddItemDto>({
      inventoryId: props.inventoryId,
      itemType: group.itemName,
    });

    const response = await apiClient.post<AddItemDto | null>('/api/StoredItems/add', {
      dto: addItemDto
    });

    if (response.data) {
      addedItemDto.value = response.data;
      showModal.value = true;
    }
  } catch (err) {
    console.error('Failed to add item:', err);
  }
}
</script>

<template>
  <div class="d-flex btn-group align-items-center mb-2">
    <button class="btn btn-outline-danger btn-md"
            :disabled="selectedIds.size === 0"
            @click="deleteSelectedItems"
            :title="t('inventoryInfo.storedItemsTab.deleteSelectedTitle')">
      <i class="bi bi-trash"></i>
    </button>
    <input type="text"
           v-model="dto.searchValue"
           class="form-control form-control-md"
           :placeholder="t('inventoryInfo.storedItemsTab.searchPlaceholder')"/>
  </div>

  <div style="max-height: 70vh; overflow-y: auto;" @scroll="handleScroll">
    <div class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="sticky-top table-light">
        <tr>
          <th style="width: 2rem">
            <input type="checkbox"
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
              <input type="checkbox"
                     :checked="isGroupSelected(group)"
                     @change="toggleGroupSelection(group)"/>
            </td>
            <td class="d-flex justify-content-between align-items-center">
              <strong>{{ group.itemName }}</strong>
              <button class="btn btn-sm btn-outline-primary"
                      @click="addItemToGroup(group)"
                      :title="t('inventoryInfo.storedItemsTab.addItemTitle')">
                {{ t('inventoryInfo.storedItemsTab.addItemButton') }}
              </button>
            </td>
          </tr>
          <tr v-for="item in group.itemIds" :key="item.id" class="table-secondary">
            <td>
              <input type="checkbox"
                     :checked="selectedIds.has(item.id)"
                     @change="toggleSelection(item.id)"/>
            </td>
            <td class="text-primary" style="cursor: pointer;">
              {{ item.customId?.trim() || item.id }}
            </td>
          </tr>
          <tr v-if="!group.itemIds?.length">
            <td colspan="2" class="text-danger">
              {{ t('inventoryInfo.storedItemsTab.table.noItems') }}
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>

  <AddItemModal v-if="showModal && addedItemDto"
                :item="addedItemDto"
                @close="showModal = false"/>
</template>

<style scoped>

</style>
