<script setup lang="ts">
import type {InventoryGetFullDto} from '@/dto/inventory/InventoryGetFullDto';
import type {InventoryUpdateDto} from '@/dto/inventory/InventoryUpdateDto';
import {ref, reactive, watch} from 'vue';
import {apiClient} from '@/services/apiClient';
import type {ResultDto} from "@/dto/general/ResultDto.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import {useI18n} from "vue-i18n";

const props = defineProps<{ inventory: InventoryGetFullDto; isCreator: boolean; }>();

const {t} = useI18n();
const userStore = useUserStore();
const isEditMode = ref(false);
const inventoryTypeInput = ref('');
const inventoryTypeSuggestions = ref<string[]>([]);
const inventoryTypeSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const suppressInventoryTypeFetch = ref(false);
const tagInput = ref('');
const tagSuggestions = ref<string[]>([]);
const tagSearchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const dto = reactive<InventoryUpdateDto>({
  inventoryId: props.inventory.id,
  isPublic: props.inventory.isPublic,
  name: props.inventory.name,
  description: props.inventory.description ?? '',
  tags: [...(props.inventory.tags ?? [])],
});

watch(() => dto, async () => {
  await scheduleSave()
}, {deep: true});

async function scheduleSave() {
  if (!isEditMode.value) return;
  if (saveTimer.value) clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => await updateInventory(), 1000);
}

async function updateInventory() {
  try {
    const response = await apiClient.post<ResultDto>('/api/Inventory/update', dto);

    if (!response.data.isSucceeded)
      alert(response.data.error);
  } catch (err: any) {
    console.error('Update failed:', err.response?.data?.message || err.message);
  }
}

watch(() => inventoryTypeInput.value, async () => {
  if (suppressInventoryTypeFetch.value) {
    suppressInventoryTypeFetch.value = false;
    return;
  }
  if (inventoryTypeSearchTimer.value) clearTimeout(inventoryTypeSearchTimer.value);
  inventoryTypeSearchTimer.value = setTimeout(async () => await fetchInventoryTypeSuggestions(), 500);
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
  dto.name = type.trim();
  inventoryTypeInput.value = type;
  inventoryTypeSuggestions.value = [];
}

watch(() => tagInput.value, async () => {
  if (tagSearchTimer.value) clearTimeout(tagSearchTimer.value);
  tagSearchTimer.value = setTimeout(async () => await fetchTagSuggestions(), 500);
});

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
  if (trimmed && !dto.tags?.includes(trimmed)) {
    dto.tags?.push(trimmed);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}

function removeTag(index: number) {
  dto.tags?.splice(index, 1);
}

function selectSuggestedTag(tag: string) {
  if (!dto.tags?.includes(tag)) {
    dto.tags?.push(tag);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}
</script>

<template>
  <div class="card" style="max-height: 70vh; overflow-y: auto;">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">
          {{ isEditMode ? t('inventoryInfo.detailsTab.titleEdit') : t('inventoryInfo.detailsTab.titleView') }}
        </h5>
        <button
            v-if="isCreator || userStore.hasAdminRights"
            class="btn btn-sm btn-outline-primary"
            @click="isEditMode = !isEditMode">
          {{ isEditMode ? t('inventoryInfo.detailsTab.viewMode') : t('inventoryInfo.detailsTab.editMode') }}
        </button>
      </div>
      <div v-if="isEditMode" class="mb-3">
        <label class="form-label">{{ t('inventoryInfo.detailsTab.inventoryType') }}</label>
        <input type="text"
               v-model="inventoryTypeInput"
               class="form-control"
               :placeholder="props.inventory.name"/>
        <ul v-if="inventoryTypeSuggestions.length" class="list-group mt-1">
          <li v-for="type in inventoryTypeSuggestions"
              :key="type"
              class="list-group-item list-group-item-action"
              @click="selectInventoryType(type)">
            {{ type }}
          </li>
        </ul>
      </div>
      <div class="mb-3">
        <div v-if="isEditMode" class="form-check">
          <input class="form-check-input"
                 type="checkbox"
                 id="isPublicCheckbox"
                 v-model="dto.isPublic"/>
          <label class="form-check-label" for="isPublicCheckbox">
            {{
              dto.isPublic
                  ? `${t('inventoryInfo.detailsTab.visibility.public')} ${t('inventoryInfo.detailsTab.visibility.suffix')}`
                  : `${t('inventoryInfo.detailsTab.visibility.private')} ${t('inventoryInfo.detailsTab.visibility.suffix')}`
            }}
          </label>
        </div>
        <p v-else class="card-text">
          {{ t('inventoryInfo.detailsTab.visibility.label') }}:
          <span :class="dto.isPublic ? 'text-success' : 'text-muted'">
            {{
              dto.isPublic
                  ? t('inventoryInfo.detailsTab.visibility.public')
                  : t('inventoryInfo.detailsTab.visibility.private')
            }}
          </span>
        </p>
      </div>
      <div class="mb-3">
        <label class="form-label">{{ t('inventoryInfo.detailsTab.description') }}</label>
        <div v-if="isEditMode">
          <textarea v-model="dto.description"
                    class="form-control" rows="3"
                    style="max-height: 20vh; overflow-y: auto;"/>
        </div>
        <p v-else class="card-text">
          <strong>{{ props.inventory.description || '—' }}</strong>
        </p>
      </div>
      <div class="mb-3">
        <label class="form-label">{{ t('inventoryInfo.detailsTab.tags.label') }}</label>
        <div v-if="isEditMode">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span v-for="(tag, index) in dto.tags"
                  :key="tag"
                  class="badge bg-secondary d-flex align-items-center">
              {{ tag }}
              <button type="button"
                      class="btn-close btn-close-white btn-sm ms-2"
                      @click="removeTag(index)"></button>
            </span>
          </div>
          <div class="input-group">
            <input type="text"
                   v-model="tagInput"
                   class="form-control"
                   :placeholder="t('inventoryInfo.detailsTab.tags.add')"/>
            <button class="btn btn-outline-success" type="button" @click="addTag">
              {{ t('inventoryInfo.detailsTab.tags.addButton') }}
            </button>
          </div>
          <ul v-if="tagSuggestions.length" class="list-group mt-1">
            <li v-for="tag in tagSuggestions"
                :key="tag"
                class="list-group-item list-group-item-action"
                @click="selectSuggestedTag(tag)">
              {{ tag }}
            </li>
          </ul>
        </div>
        <p v-else class="card-text">
          <strong>
            <span v-if="props.inventory.tags">{{ props.inventory.tags.join(', ') }}</span>
          </strong>
        </p>
      </div>
      <p class="card-text">
        <strong>{{ t('inventoryInfo.detailsTab.creator') }}:</strong> {{ props.inventory.creatorName }}
      </p>
    </div>
  </div>
</template>

<style scoped>

</style>