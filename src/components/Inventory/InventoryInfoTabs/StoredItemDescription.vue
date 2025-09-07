<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {apiClient} from '@/apiClient/apiClient';
import type {StoredItemGetFullDto} from '@/dto/item/StoredItemGetFullDto.ts';
import type {DescriptionElementDto} from "@/dto/customDescription/DescriptionElementDto.ts";
import type {ItemDescriptionElementDto} from "@/dto/customDescription/ItemDescriptionElementDto.ts";

const props = defineProps<{ storedItemId: string, inventoryId: string }>();

const pairedDescriptions = ref<{ name: string; value: string | number | boolean }[]>([]);
const imageLinks = ref<string[]>([]);
const fullDescription = ref<ItemDescriptionElementDto[]>([]);

onMounted(async () => {
  await fetchFullItemData();
  await fetchLabelSequence();
});

async function fetchFullItemData() {
  try {
    const response = await apiClient.get<StoredItemGetFullDto>('/api/StoredItems/get-full', {
      itemId: props.storedItemId
    });

    const data = response.data;
    if (!data || !data.description?.length) return;

    fullDescription.value = data.description;

    // Preload image links
    imageLinks.value = data.description
        .filter(d => d.hlinkValue)
        .map(d => d.hlinkValue!);
  } catch (err) {
    console.error('Failed to fetch full item data:', err);
  }
}

async function fetchLabelSequence() {
  try {
    const response = await apiClient.get<DescriptionElementDto[]>('/api/CustomDescriptionSequence/get', {
      inventoryId: props.inventoryId,
      itemId: props.storedItemId
    });

    const labels = response.data ?? [];

    pairedDescriptions.value = labels.map((label, index) => {
      const desc = fullDescription.value[index];
      const value =
          desc.hlinkValue ??
          desc.shortTextValue ??
          desc.longTextValue ??
          desc.numberValue ??
          desc.boolValue ??
          '';

      return {name: label.name, value};
    });
  } catch (err) {
    console.error('Failed to fetch label sequence:', err);
  }
}
</script>

<template>
  <div class="bg-light border-top p-3">
    <div class="row">
      <div v-if="imageLinks.length" class="col-md-4 mb-3">
        <div id="imageCarousel" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            <div v-for="(img, index) in imageLinks"
                 :key="index"
                 :class="['carousel-item', { active: index === 0 }]">
              <img :src="img"
                   class="d-block w-100 rounded img-fluid"
                   alt="Image"
                   style="max-height: 200px; object-fit: contain;"/>
            </div>
          </div>
          <button class="carousel-control-prev"
                  type="button"
                  data-bs-target="#imageCarousel"
                  data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
          </button>
          <button class="carousel-control-next"
                  type="button"
                  data-bs-target="#imageCarousel"
                  data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
          </button>
        </div>
      </div>

      <div class="col-md-8">
        <div v-for="(desc, index) in pairedDescriptions"
             :key="index"
             class="mb-2">
          <p class="mb-0">
            <strong>{{ desc.name }}:</strong>
            <span v-if="false">
              {{ desc.value ? 'Yes' : 'No' }}
            </span>
            <span v-else>
              {{ desc.value }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
