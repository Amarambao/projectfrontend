<script setup lang="ts">
import {defineProps, ref, onMounted, watch, computed} from 'vue';
import {apiClient} from '@/services/apiClient.ts';
import type {CustomIdElementDto} from '@/dto/customId/CustomIdElementDto.ts';
import type {ResultDto} from '@/dto/general/ResultDto.ts';
import type {CustomIdModifyDto} from "@/dto/customId/CustomIdModifyDto.ts";
import {CustomIdElementEnum} from "@/dto/enum/CustomIdElementEnum.ts";

const props = defineProps<{ inventoryId: string; itemId: string }>();

const originalSequence = ref<CustomIdElementDto[]>([]);
const sequence = ref<CustomIdElementDto[]>([]);
const draggedIndex = ref<number | null>(null);
const newElementType = ref<number>(0);
const elementOptions = Object.entries(CustomIdElementEnum)
    .filter(([key, value]) => typeof value === 'number') as [string, number][];

const isChanged = computed(() => {
  if (sequence.value.length !== originalSequence.value.length)
    return true;
  for (let i = 0; i < sequence.value.length; i++) {
    const a = sequence.value[i];
    const b = originalSequence.value[i];
    if (a.elementType !== b.elementType) return true;
    if (a.elementType === 0 && a.fixedTextValue !== b.fixedTextValue) return true;
  }
  return false;
});

onMounted(async () => {
  await loadSequence();
});

watch(() => props.itemId, async () => {
  await loadSequence();
});

async function loadSequence() {
  try {
    const response = await apiClient.get<CustomIdElementDto[]>('/api/CustomIdElementSequence/get', {
      inventoryId: props.inventoryId,
      itemId: props.itemId
    });
    originalSequence.value = response.data;
    sequence.value = JSON.parse(JSON.stringify(response.data)); // deep copy
  } catch (err) {
  }
}

function onDragStart(index: number) {
  draggedIndex.value = index;
}

function onDrop(index: number) {
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  const moved = sequence.value.splice(draggedIndex.value, 1)[0];
  sequence.value.splice(index, 0, moved);
  draggedIndex.value = null;
}

function onDropOutside() {
  if (draggedIndex.value !== null) {
    sequence.value.splice(draggedIndex.value, 1);
    draggedIndex.value = null;
  }
}

function revertChanges() {
  sequence.value = JSON.parse(JSON.stringify(originalSequence.value));
}

function addNewElement() {
  const newElement: CustomIdElementDto = {
    elementType: newElementType.value,
    fixedTextValue: newElementType.value === 0 ? '' : null
  };
  sequence.value.push(newElement);
}

async function saveChanges() {
  try {
    const dto: CustomIdModifyDto = {
      inventoryId: props.inventoryId,
      itemId: props.itemId,
      sequence: sequence.value
    };
    const response = await apiClient.post<ResultDto>('/api/CustomIdElementSequence/modify', dto);
    if (!response.data?.isSucceeded) {
      alert(response.data.error || 'Failed to save sequence');
    } else {
      originalSequence.value = JSON.parse(JSON.stringify(sequence.value));
      alert('Sequence saved');
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Error saving sequence');
  }
}
</script>

<template>
  <div class="border rounded p-3 col-mb-4" @drop.prevent="onDropOutside" @dragover.prevent>
    <h6 class="fw-bold mb-3">Custom ID Sequence</h6>
    <div class="btn-group d-flex align-items-center mb-3">
      <select v-model="newElementType" class="form-select">
        <option v-for="[label, type] in elementOptions"
                :key="type"
                :value="type">
          {{ label }}
        </option>
      </select>
      <button class="btn btn-outline-primary" @click="addNewElement">
        +
      </button>
    </div>
    <div style="max-height: 56vh; overflow-y: auto;" class="mb-3">
      <div v-for="(element, index) in sequence"
           :key="index"
           class="border rounded p-2 mb-2 bg-white"
           draggable="true"
           @dragstart="onDragStart(index)"
           @drop.prevent="onDrop(index)"
           @dragover.prevent>
        <div class="d-flex justify-content-between align-items-center">
          <strong>{{ CustomIdElementEnum[element.elementType] }}</strong>
          <span class="text-muted small">
            <i class="bi bi- me-1"></i>
          </span>
        </div>
        <div v-if="element.elementType === 0" class="mt-2">
          <input type="text"
                 v-model="element.fixedTextValue"
                 class="form-control"
                 placeholder="Fixed text value"/>
        </div>
      </div>
    </div>
    <div v-if="isChanged" class="btn-group d-flex mt-3">
      <button class="btn btn-outline-secondary w-100" @click="revertChanges">
        Revert
      </button>
      <button class="btn btn-outline-success w-100" @click="saveChanges">
        Save
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>