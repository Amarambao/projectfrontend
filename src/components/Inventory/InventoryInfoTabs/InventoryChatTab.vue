<script setup lang="ts">
import {ref, onMounted, reactive} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/services/apiClient';
import type {MessageGetDto} from "@/dto/chatMessage/MessageGetDto.ts";
import type {MessageRequestDto} from "@/dto/chatMessage/MessageRequestDto.ts";

const props = defineProps<{ inventoryId: string; isCreator: boolean }>();
const {t, locale} = useI18n();

const messages = ref<MessageGetDto[]>([]);
const hasMore = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const dto = reactive<MessageRequestDto>({
  page: 0,
  returnCount: 20,
  inventoryId: props.inventoryId,
  searchValue: null,
  userId: null,
  writtenAt: null,
});

onMounted(async () => {
  await loadMessages();
  scrollToBottom();
});

async function loadMessages() {
  if (!hasMore.value) return;

  try {
    const response = await apiClient.get<MessageGetDto[]>('/api/ChatMessages/get', dto);
    const newMessages = response.data ?? [];

    if (newMessages.length < dto.returnCount)
      hasMore.value = false;

    messages.value.push(...newMessages);
    dto.page++;
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

async function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
    await loadMessages();
  }
}

function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="card border">
    <div class="card-header">
      <h5 class="mb-0">{{ t('inventoryInfo.chatTab.title') }}</h5>
    </div>
    <div class="card-body p-0" ref="scrollContainer"
         style="height: 60vh; overflow-y: auto;"
         @scroll="onScroll">
      <div class="d-flex flex-column-reverse px-3 py-2">
        <div v-for="(msg, index) in messages" :key="index" class="mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <div class="fw-bold">{{ msg.userName }}</div>
            <div class="text-muted small">{{ formatDate(msg.writtenAt) }}</div>
          </div>
          <div class="border rounded p-2 bg-light mt-1">
            {{ msg.message }}
          </div>
        </div>
        <div v-if="!hasMore && messages.length === 0" class="text-center py-3 text-muted">
          {{ t('inventoryInfo.chatTab.noMessages') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>