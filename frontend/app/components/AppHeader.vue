<template>
  <UHeader title="VionShelf" to="/">
    <template #title>
      <span class="text-xl font-semibold">VionShelf</span>
    </template>

    <UNavigationMenu :items="navItems" />

    <template #right>
      <ClientOnly>
        <UColorModeButton />

        <template v-if="isAuth">
          <UButton
            color="neutral"
            variant="ghost"
            to="/profile"
            :label="data?.name || data?.email"
            icon="i-lucide-user"
          />
          <UButton
            color="neutral"
            variant="ghost"
            label="Вийти"
            icon="i-lucide-log-out"
            @click="logout"
          />
        </template>

        <template v-else>
          <UButton color="neutral" variant="ghost" to="/login" label="Увійти" />
          <UButton to="/register" label="Реєстрація" />
        </template>

        <template #fallback>
          <div
            class="w-20 h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
          />
        </template>
      </ClientOnly>
    </template>

    <template #body>
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { status, signOut, data } = useAuth();
const isAuth = computed(() => status.value === "authenticated");

const navItems: NavigationMenuItem[] = [
  { label: "Публічні колекції", to: "/", icon: "i-lucide-library" },
  { label: "Мої колекції", to: "/library", icon: "i-lucide-book-lock" },
];

const logout = async () => {
  await signOut({ callbackUrl: "/", redirect: true });
};
</script>
