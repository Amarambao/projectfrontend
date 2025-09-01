<script setup lang="ts">
import { defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import UsersTable from "@/components/user/UsersTable.vue";

const props = defineProps<{ inventoryId: string }>();
const { t } = useI18n();
</script>

<template>
  <div class="row g-4">
    <div class="col-md-6">
      <h5 class="mb-3">{{ t('inventoryInfo.editorsTab.writeAccess') }}</h5>
      <UsersTable :inventoryId="props.inventoryId" :isIncluded="true" />
    </div>

    <div class="col-md-6">
      <h5 class="mb-3">{{ t('inventoryInfo.editorsTab.allUsers') }}</h5>
      <UsersTable :inventoryId="props.inventoryId" :isIncluded="false" />
    </div>
  </div>
</template>

<style scoped>

</style>