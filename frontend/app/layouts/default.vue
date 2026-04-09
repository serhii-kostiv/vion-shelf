<template>
  <AppHeader />

  <UMain class="pt-5">
    <UContainer>
      <slot />
    </UContainer>
  </UMain>

  <UFooter>
    <template #left>
      <p class="text-sm text-gray-500">
        © {{ new Date().getFullYear() }} VionShelf
      </p>
    </template>
  </UFooter>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "%s | VionShelf",
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap",
      crossorigin: "",
    },
  ],
});
</script>

<style>
body {
  font-family: "Roboto";
}
</style>
