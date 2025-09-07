<script setup lang="ts">
import { defineProps, defineEmits, onMounted, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AddItemDto } from "@/dto/item/AddItemDto.ts";
import { apiClient } from "@/apiClient/apiClient.ts";
import type { CustomIdElementDto } from "@/dto/customId/CustomIdElementDto.ts";
import type { DescriptionElementDto } from "@/dto/customDescription/DescriptionElementDto.ts";
import { CustomDescriptionFieldEnum } from "@/dto/enum/CustomDescriptionFieldEnum.ts";
import { CustomIdElementEnum } from "@/dto/enum/CustomIdElementEnum.ts";

const props = defineProps<{ inventoryId: string; itemId: string }>();
const emit = defineEmits(['close', 'loadItems']);
const { t } = useI18n();

const descriptionSequence = ref<DescriptionElementDto[]>([]);
const customIdSequence = ref<CustomIdElementDto[]>([]);
const isCustomIdDisabled = ref(true);

const addItemDto = reactive<AddItemDto>({
  inventoryId: props.inventoryId,
  itemId: props.itemId,
  customId: null,
  itemDescription: []
});

onMounted(async () => {
  await loadDescriptionSequence();
  await loadCustomIdSequence();
});

async function loadDescriptionSequence() {
  try {
    const response = await apiClient.get<DescriptionElementDto[]>('/api/CustomDescriptionSequence/get', {
      inventoryId: props.inventoryId,
      itemId: props.itemId
    });
    descriptionSequence.value = response.data || [];
  } catch (err) {
    console.error(err);
  }
}

async function loadCustomIdSequence() {
  try {
    const response = await apiClient.get<CustomIdElementDto[]>('/api/CustomIdElementSequence/get', {
      inventoryId: props.inventoryId,
      itemId: props.itemId
    });
    customIdSequence.value = response.data;
  } catch (err) {
    console.error(err);
  }
}

async function addItem() {
  try {
    const response = await apiClient.post<AddItemDto | null>('/api/StoredItems/add', addItemDto);

    if (response.data) {
      Object.assign(addItemDto, response.data);
      await loadCustomIdSequence();
      isCustomIdDisabled.value = false;
    } else {
      emit('loadItems');
      emit('close');
    }
  } catch (err) {
    console.error(err);
  }
}

function getCustomIdLabel(type: CustomIdElementEnum): string {
  return t(`addItemModal.customId.enum.${CustomIdElementEnum[type]}`);
}

function getRandomPlaceholder(type: CustomIdElementEnum): string {
  switch (type) {
    case CustomIdElementEnum.Random20Bit:
      return generateSecureUint32(20).toString();
    case CustomIdElementEnum.Random32Bit:
      return generateSecureUint32(32).toString();
    case CustomIdElementEnum.Random6Digit:
      return secureRandomInt(100000, 999999).toString();
    case CustomIdElementEnum.Random9Digit:
      return secureRandomInt(100000000, 999999999).toString();
    case CustomIdElementEnum.Guid:
      return crypto.randomUUID();
    default:
      return t('addItemModal.customId.generated');
  }
}

function generateSecureUint32(bitsCountRequest: number): number {
  const byteArray = new Uint8Array(bitsCountRequest);
  crypto.getRandomValues(byteArray);

  let result = 0;
  let bitIndex = 0;

  for (let byte of byteArray) {
    for (let i = 0; i < 8 && bitIndex < bitsCountRequest; i++, bitIndex++) {
      const bit = (byte >> i) & 1;
      result |= bit << bitIndex;
    }
  }

  return result >>> 0;
}

function secureRandomInt(min: number, max: number): number {
  if (min > max) return 0;

  let rand: number;
  do {
    const array = new Int32Array(1);
    crypto.getRandomValues(array);
    rand = array[0];
  } while (rand > max || rand < min);

  return rand;
}
</script>

<template>
  <div>
    <ul class="nav nav-tabs mb-3" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="active" data-bs-toggle="tab" data-bs-target="#descriptionTab" type="button" role="tab">
          {{ t('addItemModal.itemDescription') }}
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link"
                :class="{ disabled: isCustomIdDisabled }"
                :style="isCustomIdDisabled ? 'pointer-events: none; opacity: 0.6;' : ''"
                data-bs-toggle="tab"
                data-bs-target="#customIdTab" type="button" role="tab">
          {{ t('addItemModal.id') }}
        </button>
      </li>
    </ul>

    <div class="tab-content">
      <div class="tab-pane fade show active" id="descriptionTab" role="tabpanel">
        <form @submit.prevent="addItem">
          <div v-for="(desc, index) in descriptionSequence" :key="index" class="mb-3">
            <label class="form-label">{{ desc.name }}</label>

            <input v-if="desc.descriptionType === CustomDescriptionFieldEnum.SingleLineText"
                   type="text"
                   class="form-control"
                   v-model="addItemDto.itemDescription[index].shortTextValue"/>

            <textarea v-else-if="desc.descriptionType === CustomDescriptionFieldEnum.MultiLineText"
                      class="form-control"
                      v-model="addItemDto.itemDescription[index].longTextValue"></textarea>

            <input v-else-if="desc.descriptionType === CustomDescriptionFieldEnum.Numeric"
                   type="number"
                   class="form-control"
                   v-model.number="addItemDto.itemDescription[index].numberValue"/>

            <input v-else-if="desc.descriptionType === CustomDescriptionFieldEnum.DocumentLink"
                   type="text"
                   class="form-control"
                   v-model="addItemDto.itemDescription[index].hlinkValue"/>

            <div v-else-if="desc.descriptionType === CustomDescriptionFieldEnum.BooleanValue" class="form-check">
              <input type="checkbox"
                     class="form-check-input"
                     v-model="addItemDto.itemDescription[index].boolValue"/>
              <label class="form-check-label">{{ t('addItemModal.yes') }}</label>
            </div>
          </div>

          <button type="submit" class="btn btn-primary">{{ t('addItemModal.submit') }}</button>
        </form>
      </div>
      <div class="tab-pane fade" id="customIdTab" role="tabpanel">
        <div v-if="!isCustomIdDisabled">
          <div v-for="(element, idx) in customIdSequence" :key="idx" class="mb-3">
            <label class="form-label">{{ getCustomIdLabel(element.elementType) }}</label>

            <input v-if="element.elementType === CustomIdElementEnum.FixedText"
                   type="text"
                   class="form-control"
                   :value="element.fixedTextValue ?? ''"
                   disabled/>

            <input v-else-if="element.elementType === CustomIdElementEnum.DateTime"
                   type="text"
                   class="form-control"
                   :value="new Date().toISOString()"
                   disabled/>

            <input v-else-if="element.elementType === CustomIdElementEnum.UIntSequence"
                   type="number"
                   class="form-control"
                   :value="element.incrementValue ?? 0"
                   disabled/>

            <input v-else
                   type="text"
                   class="form-control"
                   :value="getRandomPlaceholder(element.elementType)"
                   disabled/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
