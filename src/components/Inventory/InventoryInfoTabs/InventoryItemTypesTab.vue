<script setup lang="ts">
import {ref, computed, onMounted, defineProps, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient.ts';
import type {ResultDto} from '@/dto/general/ResultDto.ts';
import type {IdAndNameDto} from '@/dto/general/IdAndNameDto.ts';
import CustomIdEditor from '@/components/customId/CustomIdEditor.vue';

const props = defineProps<{ inventoryId: string }>();
const {t} = useI18n();

const originalData = ref<IdAndNameDto[]>([]);
const itemList = ref<IdAndNameDto[]>([]);
const itemInput = ref('');
const itemSuggestions = ref<string[]>([]);
const itemSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const selectedItemId = ref<string | null>(null);
const draggedItem = ref<IdAndNameDto | null>(null);

const isChanged = computed(() => {
  if (itemList.value.length !== originalData.value.length) return true;
  for (let i = 0; i < itemList.value.length; i++) {
    if (itemList.value[i].name !== originalData.value[i].name) return true;
  }
  return false;
});

onMounted(async () => {
  await loadInventoryItems();
});

async function loadInventoryItems() {
  try {
    const response = await apiClient.get<IdAndNameDto[]>('/api/ItemType/get-by-inventory-id', {
      inventoryId: props.inventoryId,
    });
    originalData.value = response.data || [];
    itemList.value = [...originalData.value];
  } catch (err) {
    console.error('Failed to load inventory items:', err);
  }
}

watch(itemInput, () => {
  if (itemSearchTimer.value) clearTimeout(itemSearchTimer.value);
  itemSearchTimer.value = setTimeout(fetchItemSuggestions, 500);
});

async function fetchItemSuggestions() {
  const query = itemInput.value.trim();
  if (!query) {
    itemSuggestions.value = [];
    return;
  }
  try {
    const response = await apiClient.get<string[]>('/api/ItemType/get', {
      page: 0,
      returnCount: 5,
      searchValue: query,
    });
    itemSuggestions.value = response.data || [];
  } catch {
    itemSuggestions.value = [];
  }
}

function addItem(name: string) {
  const trimmed = name.trim();
  if (!trimmed || itemList.value.some(i => i.name === trimmed)) return;
  itemList.value.push({id: crypto.randomUUID(), name: trimmed});
  itemInput.value = '';
  itemSuggestions.value = [];
}

function removeItem(item: IdAndNameDto) {
  itemList.value = itemList.value.filter(i => i.id !== item.id);
}

function rollbackChanges() {
  itemList.value = [...originalData.value];
  itemInput.value = '';
  itemSuggestions.value = [];
}

function selectItem(itemId: string) {
  selectedItemId.value = itemId;
}

async function saveChanges() {
  try {
    const dto = {
      id: props.inventoryId,
      values: itemList.value.map(i => i.name),
    };
    const response = await apiClient.post<ResultDto>('/api/InventoryItemType/modify', dto);
    if (!response.data?.isSucceeded) {
      alert(response.data.error);
    } else {
      originalData.value = [...itemList.value];
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Error saving item types');
  }
}

function onDragStart(item: IdAndNameDto) {
  draggedItem.value = item;
}

function onDragEnd(e: DragEvent) {
  const container = document.querySelector('.item-drop-zone') as HTMLElement;
  const bounds = container.getBoundingClientRect();
  if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
  ) {
    if (draggedItem.value) {
      removeItem(draggedItem.value);
      draggedItem.value = null;
    }
  }
}
</script>

<template>
  <div class="row">
    <div class="border rounded p-3 col-md-4">
      <h6 class="fw-bold mb-3">{{ t('inventoryInfo.itemTypesTab.title') }}</h6>

      <div class="dropdown mb-3">
        <input
            type="text"
            v-model="itemInput"
            class="form-control"
            :placeholder="t('inventoryInfo.itemTypesTab.searchPlaceholder')"/>
        <ul
            class="list-group position-absolute w-100 z-3"
            v-if="itemSuggestions.length"
            style="max-height: 25vh; overflow-y: auto;">
          <li
              v-for="suggestion in itemSuggestions"
              :key="suggestion"
              class="list-group-item list-group-item-action"
              @mousedown.prevent
              @click="addItem(suggestion)">
            {{ suggestion }}
          </li>
        </ul>
      </div>

      <div class="border rounded mb-3 item-drop-zone" style="max-height: 56vh; overflow-y: auto;">
        <ul class="list-group list-group-flush">
          <li
              v-for="item in itemList"
              :key="item.id"
              class="list-group-item d-flex justify-content-between align-items-center"
              draggable="true"
              @dragstart="onDragStart(item)"
              @dragend="onDragEnd"
              @click="selectItem(item.id)">
            <span>{{ item.name }}</span>
          </li>
          <li v-if="itemList.length === 0" class="list-group-item text-muted">
            {{ t('inventoryInfo.itemTypesTab.noItems') }}
          </li>
        </ul>
      </div>

      <div v-if="isChanged" class="btn-group d-flex">
        <button class="btn btn-outline-secondary w-100" @click="rollbackChanges">
          {{ t('inventoryInfo.itemTypesTab.buttons.revert') }}
        </button>
        <button class="btn btn-outline-success w-100" @click="saveChanges">
          {{ t('inventoryInfo.itemTypesTab.buttons.save') }}
        </button>
      </div>
    </div>

    <div class="col-md-8">
      <CustomIdEditor v-if="selectedItemId" :inventoryId="props.inventoryId" :itemId="selectedItemId"/>
    </div>
  </div>
</template>


<style scoped>

</style>