<script setup lang="ts">
import {ref, reactive, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient.ts';
import type {InventoryCreateDto} from '@/dto/inventory/InventoryCreateDto.ts';
import type {ResultDtoGeneric} from '@/dto/general/ResultDto.ts';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const {t} = useI18n();
const win = window;
const error = ref<string | null>(null);
const suppressInventoryTypeFetch = ref(false);
const inventoryTypeInput = ref('');
const inventoryTypeSuggestions = ref<string[]>([]);
const inventoryTypeSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const itemInput = ref('');
const itemSuggestions = ref<string[]>([]);
const itemSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const tagInput = ref('');
const tagSuggestions = ref<string[]>([]);
const tagSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const dto = reactive<InventoryCreateDto>({
  inventoryType: '',
  description: '',
  isPublic: false,
  itemNames: [],
  tags: []
});

watch(() => inventoryTypeInput.value, async () => {
  if (suppressInventoryTypeFetch.value) {
    suppressInventoryTypeFetch.value = false;
    return;
  }
  if (inventoryTypeSearchTimer.value) clearTimeout(inventoryTypeSearchTimer.value);
  inventoryTypeSearchTimer.value = setTimeout(async () => await fetchInventoryTypeSuggestions(), 500);
});

watch(() => itemInput.value, async () => {
  if (itemSearchTimer.value) clearTimeout(itemSearchTimer.value);
  itemSearchTimer.value = setTimeout(async () => await fetchItemSuggestions(), 500);
});

watch(() => tagInput.value, async () => {
  if (tagSearchTimer.value) clearTimeout(tagSearchTimer.value);
  tagSearchTimer.value = setTimeout(async () => await fetchTagSuggestions(), 500);
});

async function fetchInventoryTypeSuggestions() {
  if (!inventoryTypeInput.value.trim()) {
    inventoryTypeSuggestions.value = [];
    return;
  }

  try {
    const response = await apiClient.get<string[]>('/api/InventoryType/get', {
      page: 0,
      returnCount: 5,
      searchValue: inventoryTypeInput.value.trim()
    });

    inventoryTypeSuggestions.value = response.data || [];
  } catch {
    inventoryTypeSuggestions.value = [];
  }
}

function selectInventoryType(type: string) {
  suppressInventoryTypeFetch.value = true;
  dto.inventoryType = type.trim();
  inventoryTypeInput.value = type;
  inventoryTypeSuggestions.value = [];
}

async function fetchItemSuggestions() {
  if (!itemInput.value.trim()) {
    itemSuggestions.value = [];
    return;
  }

  try {
    const response = await apiClient.get<string[]>('/api/ItemType/get', {
      page: 0,
      returnCount: 5,
      searchValue: itemInput.value.trim()
    });
    itemSuggestions.value = response.data || [];
  } catch {
    itemSuggestions.value = [];
  }
}

function addItem() {
  const trimmed = itemInput.value.trim();
  if (trimmed && !dto.itemNames.includes(trimmed)) {
    dto.itemNames.push(trimmed);
  }
  itemInput.value = '';
  itemSuggestions.value = [];
}

function removeItem(index: number) {
  dto.itemNames.splice(index, 1);
}

function selectSuggestedItem(name: string) {
  if (!dto.itemNames.includes(name)) {
    dto.itemNames.push(name);
  }
  itemInput.value = '';
  itemSuggestions.value = [];
}

async function fetchTagSuggestions() {
  if (!tagInput.value.trim()) {
    tagSuggestions.value = [];
    return;
  }

  try {
    const response = await apiClient.get<string[]>('/api/ItemType/get', {
      page: 0,
      returnCount: 5,
      searchValue: tagInput.value.trim()
    });
    tagSuggestions.value = response.data || [];
  } catch {
    tagSuggestions.value = [];
  }
}

function addTag() {
  const trimmed = tagInput.value.trim();
  if (trimmed && !dto.tags.includes(trimmed)) {
    dto.tags.push(trimmed);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}

function removeTag(index: number) {
  dto.tags.splice(index, 1);
}

function selectSuggestedTag(tag: string) {
  if (!dto.tags.includes(tag)) {
    dto.tags.push(tag);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}

async function submit() {
  if (!dto.inventoryType.trim()) {
    error.value = t('inventoryCreate.validation.typeRequired');
    return;
  }
  error.value = null;

  try {
    const response = await apiClient.post<ResultDtoGeneric<string>>('/api/Inventory/create', dto);

    if (response.data?.isSucceeded && response.data.data) {
      emit('created');
      emit('close');
      win.open(`/inventory/${response.data.data}`, '_blank');
    } else {
      error.value = response.data?.error || t('inventoryCreate.error.creationFailed');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || t('inventoryCreate.error.creationError');
  }
}
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t('inventoryCreate.title') }}</h5>
          <button type="button" class="btn-close" @click="emit('close')"/>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">{{ t('inventoryCreate.fields.inventoryType') }}</label>
            <div class="dropdown w-100">
              <input type="text"
                     class="form-control dropdown-toggle"
                     v-model="inventoryTypeInput"
                     @keyup.enter="selectInventoryType(inventoryTypeInput)"
                     data-bs-toggle="dropdown"
                     aria-expanded="false"/>
              <ul class="dropdown-menu show w-100" v-if="inventoryTypeSuggestions.length">
                <li v-for="(suggestion, index) in inventoryTypeSuggestions" :key="index">
                  <button class="dropdown-item" type="button" @click="selectInventoryType(suggestion)">
                    {{ suggestion }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ t('inventoryCreate.fields.description') }}</label>
            <textarea class="form-control"
                      v-model="dto.description"
                      rows="3"
                      style="max-height: 20vh; overflow-y: auto;"/>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" v-model="dto.isPublic" id="isPublic"/>
            <label class="form-check-label" for="isPublic">
              {{ t('inventoryCreate.fields.isPublic') }}
            </label>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ t('inventoryCreate.fields.itemNames') }}</label>
            <div class="d-flex gap-2 mb-2">
              <div class="dropdown flex-grow-1">
                <input type="text"
                       class="form-control dropdown-toggle"
                       v-model="itemInput"
                       @keyup.enter="addItem"
                       data-bs-toggle="dropdown"
                       aria-expanded="false"/>
                <ul class="dropdown-menu show w-100" v-if="itemSuggestions.length">
                  <li v-for="(suggestion, index) in itemSuggestions" :key="index">
                    <button class="dropdown-item" type="button" @click="selectSuggestedItem(suggestion)">
                      {{ suggestion }}
                    </button>
                  </li>
                </ul>
              </div>
              <button class="btn btn-outline-secondary" type="button" @click="addItem">+</button>
            </div>
            <ul class="list-group">
              <li v-for="(item, index) in dto.itemNames" :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center">
                {{ item }}
                <button class="btn btn-sm btn-outline-danger" @click="removeItem(index)">×</button>
              </li>
            </ul>
          </div>
          <div class="mb-3">
            <label class="form-label">{{ t('inventoryCreate.fields.tags') }}</label>
            <div class="d-flex gap-2 mb-2">
              <div class="dropdown flex-grow-1">
                <input type="text"
                       class="form-control dropdown-toggle"
                       v-model="tagInput"
                       @keyup.enter="addTag"
                       data-bs-toggle="dropdown"
                       aria-expanded="false"/>
                <ul class="dropdown-menu show w-100" v-if="tagSuggestions.length">
                  <li v-for="(suggestion, index) in tagSuggestions" :key="index">
                    <button class="dropdown-item" type="button" @click="selectSuggestedTag(suggestion)">
                      {{ suggestion }}
                    </button>
                  </li>
                </ul>
              </div>
              <button class="btn btn-outline-secondary" type="button" @click="addTag">+</button>
            </div>
            <ul class="list-group">
              <li v-for="(tag, index) in dto.tags" :key="index"
                  class="list-group-item d-flex justify-content-between align-items-center">
                {{ tag }}
                <button class="btn btn-sm btn-outline-danger" @click="removeTag(index)">×</button>
              </li>
            </ul>
          </div>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
