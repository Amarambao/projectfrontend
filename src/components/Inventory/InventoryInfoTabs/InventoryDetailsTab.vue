<script setup lang="ts">
import type {InventoryGetFullDto} from '@/dto/inventory/InventoryGetFullDto';
import type {InventoryUpdateDto} from '@/dto/inventory/InventoryUpdateDto';
import {ref, reactive, watch, defineEmits} from 'vue';
import {apiClient} from '@/apiClient/apiClient';
import type {ResultDto} from "@/dto/general/ResultDto.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import {useI18n} from "vue-i18n";
import router from "@/router";
import type {IdAndListDto} from "@/dto/general/IdAndListDto.ts";

const props = defineProps<{ inventory: InventoryGetFullDto; isCreator: boolean; }>();

const emit = defineEmits(['reloadInventory']);

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

const invUpdateDto = reactive<InventoryUpdateDto>({
  inventoryId: props.inventory.id,
  isPublic: props.inventory.isPublic,
  name: props.inventory.name,
  description: props.inventory.description ?? '',
  concurrencyStamp: props.inventory.concurrencyStamp
});

const tagsUpdDto = reactive<IdAndListDto>({
  id: props.inventory.id,
  values: [...(props.inventory.tags ?? [])],
})

watch(() => invUpdateDto, async () => {
  await scheduleUpdate()
}, {deep: true});


async function scheduleUpdate() {
  if (!isEditMode.value) return;
  if (saveTimer.value) clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => await updateInventory(), 5000);
}

async function updateInventory() {
  try {
    const response = await apiClient.post<ResultDto>('/api/Inventory/update', invUpdateDto);

    if (!response.data.isSucceeded)
      alert(response.data.error);
    else
      emit('reloadInventory');
  } catch (err) {
    console.error(err);
  }
}

watch(() => tagsUpdDto, async () => {
  await scheduleTagsUpdate()
}, {deep: true});

async function scheduleTagsUpdate() {
  if (!isEditMode.value) return;
  if (saveTimer.value) clearTimeout(saveTimer.value);
  saveTimer.value = setTimeout(async () => await updateTags(), 1000);
}

async function updateTags() {
  try {
    const response = await apiClient.post<ResultDto>('/api/InventoryTag/modify', tagsUpdDto);

    if (response.data)
      alert(response.data.error);
    else
      emit('reloadInventory');
  } catch (err) {
    console.error(err);
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
  } catch (err) {
    console.error(err);
  }
}

function selectInventoryType(type: string) {
  suppressInventoryTypeFetch.value = true;
  invUpdateDto.name = type.trim();
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
    const response = await apiClient.get<string[]>('/api/Tag/get', {
      page: 0,
      returnCount: 5,
      searchValue: tagInput.value.trim()
    });
    tagSuggestions.value = response.data || [];
  } catch (err) {
    console.error(err);
  }
}

function addTag() {
  const trimmed = tagInput.value.trim();
  if (trimmed && !tagsUpdDto.values?.includes(trimmed)) {
    tagsUpdDto.values?.push(trimmed);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}

function removeTag(index: number) {
  tagsUpdDto.values?.splice(index, 1);
}

function selectSuggestedTag(tag: string) {
  if (!tagsUpdDto.values?.includes(tag)) {
    tagsUpdDto.values?.push(tag);
  }
  tagInput.value = '';
  tagSuggestions.value = [];
}

async function deleteInventory() {
  try {
    const response = await apiClient.delete<ResultDto>('/api/Inventory/delete', null, {
      inventoryIds: [props.inventory.id]
    });

    if (response.data?.isSucceeded) {
      await router.push(`/`)
    } else {
      alert(response.data.error);
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="card" style="max-height: 70vh; overflow-y: auto;">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">
          {{ isEditMode ? t('inventoryInfo.detailsTab.titleEdit') : t('inventoryInfo.detailsTab.titleView') }}
        </h5>
        <button v-if="isCreator || userStore.hasAdminRights"
                class="btn btn-sm btn-outline-primary"
                @click="isEditMode = !isEditMode">
          {{ isEditMode ? t('inventoryInfo.detailsTab.viewMode') : t('inventoryInfo.detailsTab.editMode') }}
        </button>
      </div>
      <div v-if="isEditMode" class="mt-3 text-end">
        <button class="btn btn-sm btn-outline-danger" @click="deleteInventory">
          {{ t('inventoryInfo.detailsTab.delete') }}
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
                 v-model="invUpdateDto.isPublic"/>
          <label class="form-check-label" for="isPublicCheckbox">
            {{
              invUpdateDto.isPublic
                  ? `${t('inventoryInfo.detailsTab.visibility.public')} ${t('inventoryInfo.detailsTab.visibility.suffix')}`
                  : `${t('inventoryInfo.detailsTab.visibility.private')} ${t('inventoryInfo.detailsTab.visibility.suffix')}`
            }}
          </label>
        </div>
        <p v-else class="card-text">
          {{ t('inventoryInfo.detailsTab.visibility.label') }}:
          <span :class="invUpdateDto.isPublic ? 'text-success' : 'text-muted'">
            {{
              invUpdateDto.isPublic
                  ? t('inventoryInfo.detailsTab.visibility.public')
                  : t('inventoryInfo.detailsTab.visibility.private')
            }}
          </span>
        </p>
      </div>
      <div class="mb-3">
        <label class="form-label">{{ t('inventoryInfo.detailsTab.description') }}</label>
        <div v-if="isEditMode">
          <textarea v-model="invUpdateDto.description"
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
            <span v-for="(tag, index) in tagsUpdDto.values"
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
              +
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