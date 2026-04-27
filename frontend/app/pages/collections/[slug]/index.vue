<template>
  <div>
    <div v-if="status === 'pending'" class="space-y-4">
      <USkeleton class="h-8 w-48" />
      <USkeleton class="h-4 w-72" />
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6">
        <USkeleton v-for="n in 6" :key="n" class="aspect-2/3 rounded-lg" />
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      title="Колекцію не знайдено"
      :description="error.message"
    />

    <template v-else-if="collection">
      <div class="flex items-start justify-between mb-6">
        <div>
          <UBreadcrumb
            :items="[
              { label: 'Публічні колекції', to: '/' },
              { label: collection.title },
            ]"
            class="mb-2"
          />
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-semibold">{{ collection.title }}</h1>
            <UBadge :label="collection.category" variant="soft" size="sm" />
          </div>
          <p
            v-if="collection.description"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ collection.description }}
          </p>
          <p class="text-sm text-gray-400 mt-1">
            {{ collection.user.name }}
          </p>
        </div>
      </div>

      <div
        v-if="collection.items.length === 0"
        class="text-center py-20 text-gray-400"
      >
        <p>Колекція порожня.</p>
      </div>

      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <CollectionItemCard
          v-for="item in collection.items"
          :key="item.id"
          :item="item"
          :slug="slug"
          :isOwner="false"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CollectionDetail } from "~/types/collection";

definePageMeta({ auth: false });

const route = useRoute();
const slug = route.params.slug as string;

useSeoMeta({ title: slug });

const {
  data: collection,
  status,
  error,
} = await useApi<CollectionDetail>(`/collections/${slug}`);
</script>
