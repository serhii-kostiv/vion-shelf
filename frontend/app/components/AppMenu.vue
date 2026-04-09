<template>
  <nav aria-label="Main navigation">
    <ul class="flex items-center space-x-1">
      <li v-for="link in links" :key="link.to">
        <NuxtLink
          :to="link.to"
          class="px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          active-class="bg-gray-100 dark:bg-gray-800 font-medium"
        >
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const links = [{ to: "/collections", label: "Колекції" }];
</script>
