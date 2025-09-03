<script setup lang="ts">
import {defineProps, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import UsersTable from "@/components/user/UsersTable.vue";

const props = defineProps<{ inventoryId: string }>();
const {t} = useI18n();
const activeTab = ref<'write' | 'all'>('write');
</script>

<template>
  <div>
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <button class="nav-link"
                :class="{ active: activeTab === 'write' }"
                @click="activeTab = 'write'">
          {{ t('inventoryInfo.editorsTab.writeAccess') }}
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link"
                :class="{ active: activeTab === 'all' }"
                @click="activeTab = 'all'">
          {{ t('inventoryInfo.editorsTab.allUsers') }}
        </button>
      </li>
    </ul>

    <UsersTable v-if="activeTab === 'write'" :inventoryId="props.inventoryId" :isIncluded="true"/>
    <UsersTable v-else :inventoryId="props.inventoryId" :isIncluded="false"/>
  </div>
</template>

<style scoped>

</style>