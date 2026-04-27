<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">Публічні колекції</h1>
    </div>

    <div
      v-if="status === 'pending'"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <USkeleton v-for="n in 4" :key="n" class="h-28 rounded-lg" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      title="Не вдалося завантажити колекції"
      :description="error.message"
    />

    <div v-else-if="isEmpty" class="text-center py-20 text-gray-400">
      <p class="mb-4">Колекції відсутні</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CollectionCard
        v-for="collection in collections"
        :key="collection.id"
        :collection="collection"
        source="public"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection, PaginatedResult } from "~/types/collection";

definePageMeta({ auth: false });
useSeoMeta({ title: "Публічні колекції" });

const { data, status, error } = await useApi<PaginatedResult<Collection>>(
  "/collections/public",
);

const collections = computed(() => data.value?.data ?? []);
const isEmpty = computed(
  () => status.value === "success" && collections.value.length === 0,
);
</script>
