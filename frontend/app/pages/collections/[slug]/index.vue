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
          <div class="flex items-center gap-2 mb-1">
            <NuxtLink
              to="/collections"
              class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Колекції
            </NuxtLink>
            <span class="text-gray-300 dark:text-gray-600">/</span>
            <h1 class="text-2xl font-semibold">{{ collection.title }}</h1>
            <UBadge :label="collection.category" variant="soft" size="sm" />
          </div>
          <p
            v-if="collection.description"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ collection.description }}
          </p>
        </div>
        <UButton icon="i-lucide-plus" label="Додати елемент" @click="addItem" />
      </div>

      <div
        v-if="collection.items.length === 0"
        class="text-center py-20 text-gray-400"
      >
        <p>Колекція порожня. Додайте перший елемент.</p>
      </div>

      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <CollectionItemCard
          v-for="item in collection.items"
          :key="item.id"
          :item="item"
          :slug="slug"
          @edit="editItem"
          @remove="removeItem"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CollectionDetail, CollectionItem } from "~/types/collection";

definePageMeta({ auth: true });

const route = useRoute();
const slug = route.params.slug as string;

useSeoMeta({ title: slug });

const {
  data: collection,
  status,
  error,
  refresh,
} = await useApi<CollectionDetail>(`/collections/${slug}`);

const openCollectionItemModal = useCollectionItemModal();
const confirm = useConfirmDialog();

async function addItem() {
  if (!collection.value) return;
  const result = await openCollectionItemModal({
    collectionId: collection.value.id,
    collectionCategory: collection.value.category,
  });
  if (result) refresh();
}

async function editItem(item: CollectionItem) {
  if (!collection.value) return;
  const result = await openCollectionItemModal({
    collectionId: collection.value.id,
    collectionCategory: collection.value.category,
    item,
  });
  if (result) refresh();
}

async function removeItem(item: CollectionItem) {
  const confirmed = await confirm({
    title: "Видалити елемент?",
    description: `"${item.mediaItem.title}" буде видалено з колекції.`,
    confirmLabel: "Видалити",
    confirmColor: "error",
  });
  if (!confirmed) return;

  await useApiFetch(`/collections/items/${item.id}`, { method: "DELETE" });
  refresh();
}
</script>
