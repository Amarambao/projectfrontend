<script setup lang="ts">
import AppHeader from "@/components/appHeader/AppHeader.vue";
</script>

<template>
  <div class="d-flex flex-column h-100">
    <header class="flex-shrink-0">
      <AppHeader />
    </header>

    <main class="flex-grow-1 overflow-hidden px-4 pt-3">
      <router-view />
    </main>
  </div>
</template>

<style scoped>

</style>
