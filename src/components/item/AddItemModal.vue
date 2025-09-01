<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import type {AddItemDto} from "@/dto/item/AddItemDto.ts";

const props = defineProps<{ item: AddItemDto }>();

const { t } = useI18n();
const emit = defineEmits(['close']);
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" role="dialog" style="background-color: rgba(0, 0, 0, 0.5);">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ t('Item added') }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <pre class="mb-0">{{ JSON.stringify(item, null, 2) }}</pre>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary btn-sm" @click="$emit('close')">
            {{ t('Close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
