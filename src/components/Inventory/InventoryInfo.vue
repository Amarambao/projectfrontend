<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {apiClient} from '@/services/apiClient';
import type {InventoryGetFullDto} from '@/dto/inventory/InventoryGetFullDto';
import InventoryDetailsTab from "@/components/Inventory/InventoryInfoTabs/InventoryDetailsTab.vue";
import InventoryItemTypesTab from "@/components/Inventory/InventoryInfoTabs/InventoryItemTypesTab.vue";
import InventoryStoredItemsTab from "@/components/Inventory/InventoryInfoTabs/InventoryStoredItemsTab.vue";
import InventoryEditorsTab from "@/components/Inventory/InventoryInfoTabs/InventoryEditorsTab.vue";
import type {ResultDtoGeneric} from "@/dto/general/ResultDto.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import {useJwtStore} from "@/stores/JwtStore.ts";
import InventoryChatTab from "@/components/Inventory/InventoryInfoTabs/InventoryChatTab.vue";

const {t} = useI18n();
const route = useRoute();
const userStore = useUserStore();
const jwtStore = useJwtStore();
const activeTab = ref<'details' | 'types' | 'items' | 'editors' | 'chat'>('details');
const inventory = ref<InventoryGetFullDto | null>(null);
const isCreator = ref(false);
const isEditor = ref(false);

onMounted(async () => {
  if (jwtStore.isTokenValid() && jwtStore.isTokenValid()) {
    await checkPermissions();
  }
  await loadInventory();
});

async function loadInventory() {
  try {
    const response = await apiClient.get<ResultDtoGeneric<InventoryGetFullDto | null>>('/api/Inventory/get-full', {inventoryId: route.params.id});

    if (!response.data?.isSucceeded) {
      alert(response.data.error);
    } else {
      inventory.value = response.data.data!;
    }
  } catch (err: any) {
    console.error('Failed to load inventory:', err);
  }
}

async function checkPermissions() {
  try {
    const [creatorRes, editorRes] = await Promise.all([
      apiClient.get<boolean>('/api/Check/is-inv-creator-check', {inventoryId: route.params.id}),
      apiClient.get<boolean>('/api/Check/is-editor-check', {inventoryId: route.params.id})
    ]);

    isCreator.value = creatorRes.data;
    isEditor.value = editorRes.data;
  } catch (err: any) {
    console.warn('Permission check failed:', err);
  }
}
</script>

<template>
  <div class="container py-4">
    <h4 class="mb-3">{{ inventory?.name }}</h4>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'details' }" @click="activeTab = 'details'">
          {{ t('inventoryInfo.tabs.details') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">
          {{ t('inventoryInfo.tabs.chat') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">
          {{ t('inventoryInfo.tabs.items') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'types' }" @click="activeTab = 'types'">
          {{ t('inventoryInfo.tabs.types') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: activeTab === 'editors' }" @click="activeTab = 'editors'">
          {{ t('inventoryInfo.tabs.editors') }}
        </button>
      </li>
    </ul>

    <div v-if="inventory">
      <InventoryDetailsTab v-if="activeTab === 'details'"
                           :inventory="inventory"
                           :isCreator="isCreator"/>
      <InventoryChatTab v-if="activeTab === 'chat'"
                        :inventoryId="inventory.id"
                        :isCreator="isCreator"/>
      <InventoryStoredItemsTab v-if="activeTab === 'items'"
                               :inventoryId="inventory.id"/>
      <InventoryItemTypesTab v-if="activeTab === 'types'"
                             :inventoryId="inventory.id"/>
      <InventoryEditorsTab v-if="activeTab === 'editors'"
                           :inventoryId="inventory.id"/>
    </div>
  </div>
</template>

<style scoped>

</style>
