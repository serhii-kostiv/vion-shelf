<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">Мої колекції</h1>
      <UButton
        class="cursor-pointer"
        icon="i-lucide-plus"
        label="Нова колекція"
        @click="openCreate"
      />
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
      <p class="mb-4">У вас ще немає колекцій</p>
      <UButton
        icon="i-lucide-plus"
        label="Створити першу"
        variant="soft"
        @click="openCreate"
      />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <CollectionCard
        v-for="collection in collections"
        :key="collection.id"
        :collection="collection"
        @edit="openEdit"
        @remove="removeCollection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection, PaginatedResult } from "~/types/collection";

definePageMeta({ auth: true });
useSeoMeta({ title: "Мої колекції" });

const openCollectionModal = useCollectionModal();
const confirm = useConfirmDialog();

const { data, status, error, refresh } =
  await useApi<PaginatedResult<Collection>>("/collections");

const collections = computed(() => data.value?.data ?? []);
const isEmpty = computed(
  () => status.value === "success" && collections.value.length === 0,
);

async function openCreate() {
  const result = await openCollectionModal();
  if (result) refresh();
}

async function openEdit(collection: Collection) {
  const result = await openCollectionModal(collection);
  if (result) refresh();
}

async function removeCollection(collection: Collection) {
  const confirmed = await confirm({
    title: "Видалити колекцію?",
    description: `"${collection.title}" та всі її елементи будуть видалені назавжди.`,
    confirmLabel: "Видалити",
    confirmColor: "error",
  });
  if (!confirmed) return;

  await useApiFetch(`/collections/${collection.id}`, { method: "DELETE" });
  refresh();
}
</script>
