<template>
  <div class="container mx-auto max-w-4xl">
    <header class="flex justify-between items-center mt-5">
      <div class="flex items-center space-x-12">
        <div>
          <NuxtLink
            to="/"
            class="text-xl font-semibold p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            VionShelf
          </NuxtLink>
        </div>

        <!-- <AppMenu /> -->
      </div>

      <!-- <ClientOnly>
        <ColorModeButton />
      </ClientOnly> -->

      <div class="flex items-center space-x-4">
        <ClientOnly>
          <template v-if="isAuth">
            <NuxtLink
              to="/profile"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {{ data?.name || data?.email }}
            </NuxtLink>
            <button
              @click="signOut()"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          </template>

          <template v-else>
            <NuxtLink
              to="/login"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Login
            </NuxtLink>
            <NuxtLink
              to="/register"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Register
            </NuxtLink>
          </template>

          <template #fallback>
            <div
              class="w-20 h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
            ></div>
          </template>
        </ClientOnly>
      </div>
    </header>

    <main class="p-2 mt-10">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
useHead({
  titleTemplate: "%s | VionShelf",
  link: [
    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap",
      crossorigin: "",
    },
  ],
});

const { status, signOut, data } = useAuth();

const isAuth = computed(() => status.value === "authenticated");
</script>

<style>
body {
  font-family: "Roboto";
}
</style>
