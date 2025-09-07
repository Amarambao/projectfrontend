<script setup lang="ts">
import {defineProps, ref, onMounted, watch, computed} from 'vue';
import {apiClient} from '@/apiClient/apiClient.ts';
import {CustomDescriptionFieldEnum} from "@/dto/enum/CustomDescriptionFieldEnum.ts";
import type {CustomDescriptionSequencePostDto} from "@/dto/customDescription/CustomDescriptionSequencePostDto.ts";
import type {ResultDto} from "@/dto/general/ResultDto.ts";
import type {DescriptionElementDto} from "@/dto/customDescription/DescriptionElementDto.ts";

const props = defineProps<{ inventoryId: string; itemId: string }>();

const originalSequence = ref<DescriptionElementDto[]>([]);
const sequence = ref<DescriptionElementDto[]>([]);
const draggedIndex = ref<number | null>(null);
const newElementType = ref<number>(0);
const newElementName = ref<string>('');

const elementOptions = Object.entries(CustomDescriptionFieldEnum).filter(([key, value]) => typeof value === 'number') as [string, number][];

const isChanged = computed(() => {
  for (let i = 0; i < sequence.value.length; i++) {
    if (sequence.value[i] !== originalSequence.value[i]) return true;
  }
  return false;
});

onMounted(async () => {
  await loadSequence()
});

watch(() => props.itemId, async () => {
  await loadSequence()
});

async function loadSequence() {
  try {
    const response = await apiClient.get<DescriptionElementDto[]>('/api/CustomDescriptionSequence/get', {
      inventoryId: props.inventoryId,
      itemId: props.itemId
    });
    originalSequence.value = response.data || [];
    sequence.value = [...originalSequence.value];
  } catch (err) {
    console.error(err);
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
  sequence.value = [...originalSequence.value];
}

function addNewElement() {
  if (!newElementName.value.trim()) {
    alert('Please enter a name for the new element.');
    return;
  }

  const newElement: DescriptionElementDto = {
    name: newElementName.value.trim(),
    descriptionType: newElementType.value
  };

  sequence.value.push(newElement);
  newElementName.value = ''; // Clear input
}

async function saveChanges() {
  try {
    const dto: CustomDescriptionSequencePostDto = {
      inventoryId: props.inventoryId,
      itemId: props.itemId,
      sequence: sequence.value
    };
    const response = await apiClient.post<ResultDto>('/api/CustomDescriptionSequence/modify', dto);

    if (response.data) {
      alert(response.data.error);
    } else {
      originalSequence.value = [...sequence.value];
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="border rounded p-3 col-mb-4" @drop.prevent="onDropOutside" @dragover.prevent>
    <h6 class="fw-bold mb-3">Custom Description Sequence</h6>

    <div class="btn-group d-flex align-items-center mb-3">
      <select v-model="newElementType" class="form-select me-2">
        <option v-for="[label, type] in elementOptions" :key="type" :value="type">
          {{ label }}
        </option>
      </select>
      <input v-model="newElementName" type="text" class="form-control me-2" placeholder="Enter name"/>
      <button class="btn btn-outline-primary" @click="addNewElement">+</button>
    </div>

    <div v-for="(element, index) in sequence"
         :key="index"
         class="border rounded p-2 mb-2 bg-white"
         draggable="true"
         @dragstart="onDragStart(index)"
         @drop.prevent="onDrop(index)"
         @dragover.prevent>
      <strong>{{ element.name }}</strong>
      <span class="text-muted ms-2">({{ CustomDescriptionFieldEnum[element.descriptionType] }})</span>
    </div>

    <div v-if="isChanged" class="btn-group d-flex mt-3">
      <button class="btn btn-outline-secondary w-100" @click="revertChanges">Revert</button>
      <button class="btn btn-outline-success w-100" @click="saveChanges">Save</button>
    </div>
  </div>
</template>

<style scoped>

</style>
