<template>
  <div>
    <div v-if="status === 'pending'" class="flex gap-6">
      <USkeleton class="w-48 aspect-2/3 rounded-lg shrink-0" />
      <div class="flex-1 space-y-3">
        <USkeleton class="h-7 w-64" />
        <USkeleton class="h-4 w-32" />
        <USkeleton class="h-4 w-48" />
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      title="Елемент не знайдено"
      :description="error.message"
    />

    <template v-else-if="item">
      <!-- Breadcrumb -->
      <UBreadcrumb
        :items="[
          { label: 'Бібліотека', to: '/library' },
          { label: item.collection?.title ?? slug, to: `/library/${slug}` },
          { label: item.mediaItem.title },
        ]"
        class="mb-6"
      />

      <div class="flex gap-6">
        <!-- Постер -->
        <div class="w-48 shrink-0">
          <div
            class="aspect-2/3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <img
              v-if="item.mediaItem.posterUrl"
              :src="item.mediaItem.posterUrl"
              :alt="item.mediaItem.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600"
            >
              <UIcon name="i-lucide-image" class="w-12 h-12" />
            </div>
          </div>
        </div>

        <!-- Інфо -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 class="text-2xl font-semibold">{{ item.mediaItem.title }}</h1>
              <p class="text-sm text-gray-400 mt-1">
                {{ item.mediaItem.type }}
              </p>
            </div>
            <div v-if="isOwner" class="grid grid-cols-1 gap-3">
              <UDropdownMenu :items="itemMenuItems">
                <UTooltip
                  text="Дії"
                  :content="{
                    side: 'top',
                  }"
                >
                  <UButton
                    icon="i-lucide-ellipsis-vertical"
                    variant="soft"
                    color="neutral"
                    size="sm"
                    aria-label="Дії"
                  />
                </UTooltip>
              </UDropdownMenu>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <p class="text-xs text-gray-400 mb-1">Статус</p>
              <UBadge
                :label="statusLabel[item.status]"
                :color="statusColor[item.status]"
                variant="soft"
              />
            </div>

            <div v-if="item.rating">
              <p class="text-xs text-gray-400 mb-1">Оцінка</p>
              <p class="font-medium">★ {{ item.rating }}/10</p>
            </div>

            <div v-if="item.progress">
              <p class="text-xs text-gray-400 mb-1">Прогрес</p>
              <p class="font-medium">{{ item.progress }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-gray-400 mb-1">Додано</p>
                <p class="text-sm">{{ formatDate(item.createdAt) }}</p>
              </div>

              <div v-if="item.updatedAt !== item.createdAt">
                <p class="text-xs text-gray-400 mb-1">Оновлено</p>
                <p class="text-sm">{{ formatDate(item.updatedAt) }}</p>
              </div>
            </div>
          </div>

          <div v-if="item.notes" class="mt-6">
            <p class="text-xs text-gray-400 mb-2">Нотатки</p>
            <p class="text-sm whitespace-pre-wrap">{{ item.notes }}</p>
          </div>

          <!-- Metadata -->
          <div v-if="hasMetadata" class="mt-6">
            <p class="text-xs text-gray-400 mb-2">Деталі</p>
            <div class="flex flex-wrap gap-x-6 gap-y-2">
              <div v-for="(value, key) in item.mediaItem.metadata" :key="key">
                <span class="text-xs text-gray-400 capitalize"
                  >{{ key }}:
                </span>
                <span class="text-sm">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="my-10" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CollectionItem } from "~/types/collection";

definePageMeta({ auth: true });

const route = useRoute();
const id = route.params.id as string;
const slug = route.params.slug as string;

const {
  data: item,
  status,
  error,
  refresh,
} = await useApi<CollectionItem>(`/collections/items/${id}`);

useSeoMeta({ title: computed(() => item.value?.mediaItem.title ?? "Елемент") });

const { isOwner } = useOwnership(() => item.value?.collection?.userId);
const { backRoute } = useNavigationSource();

const { editItem, removeItem } = useCollectionItemActions({
  get collectionId() {
    return item.value?.collectionId ?? "";
  },
  get collectionCategory() {
    return item.value?.mediaItem.type ?? "";
  },
  onUpdate: refresh,
  onRemove: async () => await navigateTo(`/library/${slug}`),
});

const itemMenuItems = computed(() =>
  item.value
    ? buildActionMenuItems(item.value, {
        onEdit: editItem,
        onRemove: removeItem,
      })
    : [],
);

const hasMetadata = computed(() =>
  item.value ? Object.keys(item.value.mediaItem.metadata).length > 0 : false,
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral";

const statusLabel: Record<string, string> = {
  PLANNED: "Заплановано",
  IN_PROGRESS: "В процесі",
  COMPLETED: "Завершено",
  DROPPED: "Покинуто",
};

const statusColor: Record<string, BadgeColor> = {
  PLANNED: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  DROPPED: "error",
};
</script>
