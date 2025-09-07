<script setup lang="ts">
import {ref, onMounted, reactive, onBeforeUnmount} from 'vue';
import {useI18n} from 'vue-i18n';
import {apiClient} from '@/apiClient/apiClient';
import type {MessageGetDto} from "@/dto/chatMessage/MessageGetDto.ts";
import type {MessageRequestDto} from "@/dto/chatMessage/MessageRequestDto.ts";
import type {MessagePostDto} from "@/dto/chatMessage/MessagePostDto.ts";
import type {ResultDto} from "@/dto/general/ResultDto.ts";
import {useUserStore} from "@/stores/UserStore.ts";
import type {IdAndListDto} from "@/dto/general/IdAndListDto.ts";
import {HubConnectionBuilder} from "@microsoft/signalr";
import {useJwtStore} from "@/stores/JwtStore.ts";

const props = defineProps<{ inventoryId: string; isCreator: boolean }>();
const {t, locale} = useI18n();

const signalrUrl = `${import.meta.env.VITE_BACKEND_MAIN_URL}hubs/chat`;

const jwtStore = useJwtStore();
const userStore = useUserStore();
const messages = ref<MessageGetDto[]>([]);
const hasMore = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const newMessage = ref('');
const selectedDates = ref<Set<string>>(new Set());

const dto = reactive<MessageRequestDto>({
  page: 0,
  returnCount: 20,
  inventoryId: props.inventoryId,
  searchValue: null,
  userId: null,
  writtenAt: null,
});

const connection = new HubConnectionBuilder()
    .withUrl(signalrUrl, {
      accessTokenFactory: () => jwtStore.getToken!
    })
    .withAutomaticReconnect()
    .build();

const deleteDto = reactive<IdAndListDto>({
  id: props.inventoryId,
  values: Array.from(selectedDates.value)
});

onMounted(async () => {
  await loadMessages();
  scrollToBottom();

  await connection.start();
  await connection.invoke('JoinInventory', props.inventoryId);

  connection.on('chat.messageCreated', (msg: MessageGetDto) => {
    messages.value.unshift(msg);
    scrollToBottom();
  });
});

onBeforeUnmount(async () => {
  await connection.invoke('LeaveInventory', props.inventoryId);
  await connection.stop();
});

async function loadMessages(reset = false) {
  if (!hasMore.value) return;

  if (reset) {
    dto.page = 0;
    messages.value = [];
    hasMore.value = true;
  }

  try {
    const response = await apiClient.get<MessageGetDto[]>('/api/ChatMessages/get', dto);
    const newMessages = response.data ?? [];

    if (newMessages.length < dto.returnCount)
      hasMore.value = false;

    messages.value.push(...newMessages);
    dto.page++;
  } catch (err) {
    console.error(err);
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

async function sendMessage() {
  const trimmed = newMessage.value.trim();
  if (!trimmed) return;

  const postDto: MessagePostDto = {
    inventoryId: props.inventoryId,
    message: trimmed
  };

  try {
    const response = await apiClient.post('/api/ChatMessages/add', postDto);

    if (!response.data) {
      await loadMessages(true);
      scrollToBottom();

      newMessage.value = '';
    } else {
      alert(response.data.error);
    }
  } catch (err) {
    console.error(err);
  }
}

function toggleSelection(date: string) {
  if (selectedDates.value.has(date)) {
    selectedDates.value.delete(date);
  } else {
    selectedDates.value.add(date);
  }
}

async function deleteSelectedMessages() {
  if (selectedDates.value.size === 0) return;

  try {
    const response = await apiClient.delete<ResultDto | null>('/api/ChatMessages/delete', null, {
      inventoryId: props.inventoryId,
      dateTimes: Array.from(selectedDates.value)
    });

    if (!response.data) {
      await loadMessages(true);
      scrollToBottom();

      selectedDates.value.clear();
    } else {
      alert(response.data?.error);
    }
  } catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="card border">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">{{ t('inventoryInfo.chatTab.title') }}</h5>
      <button v-if="isCreator || userStore.hasAdminRights"
              class="btn btn-outline-danger btn-sm"
              :disabled="selectedDates.size === 0"
              @click="deleteSelectedMessages"
              :title="t('inventoryInfo.chatTab.delete')">
        <i class="bi bi-trash"></i>
      </button>
    </div>
    <div class="card-body p-0" ref="scrollContainer"
         style="height: 60vh; overflow-y: auto;"
         @scroll="onScroll">
      <div class="d-flex flex-column-reverse px-3 py-2">
        <div v-for="(msg, index) in messages" :key="index" class="mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <input v-if="isCreator"
                     type="checkbox"
                     :checked="selectedDates.has(msg.writtenAt)"
                     @change="toggleSelection(msg.writtenAt)"/>
              <div class="fw-bold">{{ msg.userName }}</div>
            </div>
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
    <div class="card-footer">
      <div class="input-group">
        <input type="text"
               class="form-control"
               v-model="newMessage"
               :placeholder="t('inventoryInfo.chatTab.inputPlaceholder')"
               @keyup.enter="sendMessage"/>
        <button type="button"
                class="btn btn-primary"
                @click="sendMessage"
                :title="t('inventoryInfo.chatTab.send')">
          <i class="bi bi-send"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>