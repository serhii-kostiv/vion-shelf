<template>
  <div
    class="group relative flex flex-col rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
  >
    <!-- Постер -->
    <NuxtLink
      :to="itemUrl"
      class="relative aspect-2/3 bg-gray-100 dark:bg-gray-800 block"
    >
      <img
        v-if="item.mediaItem.posterUrl"
        :src="item.mediaItem.posterUrl"
        :alt="item.mediaItem.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600"
      >
        <UIcon name="i-lucide-image" class="w-8 h-8" />
      </div>

      <!-- Бейдж статусу -->
      <div class="absolute top-2 left-2">
        <UBadge
          :label="statusLabel[item.status]"
          :color="statusColor[item.status]"
          variant="solid"
          size="sm"
        />
      </div>

      <!-- Dropdown меню -->
      <div
        class="absolute top-2 right-2 transition-opacity"
        :class="
          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        "
      >
        <UDropdownMenu :items="menuItems" @update:open="isMenuOpen = $event">
          <UTooltip
            text="Дії"
            :content="{
              side: 'top',
            }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              size="xs"
              color="neutral"
              variant="soft"
              aria-label="Дії"
            />
          </UTooltip>
        </UDropdownMenu>
      </div>
    </NuxtLink>

    <!-- Інфо -->
    <div class="p-2 flex flex-col gap-1">
      <p class="text-sm font-medium leading-tight line-clamp-2">
        {{ item.mediaItem.title }}
      </p>
      <div class="flex items-center justify-between mt-auto pt-1">
        <span class="text-xs text-gray-400">{{ item.mediaItem.type }}</span>
        <span v-if="item.rating" class="text-xs text-gray-500">
          ★ {{ item.rating }}/10
        </span>
      </div>
      <div v-if="item.progress" class="flex items-center justify-between">
        <span class="text-xs text-gray-400">Прогрес</span>
        <span class="text-xs text-gray-500">{{ item.progress }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CollectionItem } from "~/types/collection";

type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral";

const props = defineProps<{
  item: CollectionItem;
  slug: string;
}>();

const emits = defineEmits<{
  edit: [item: CollectionItem];
  remove: [item: CollectionItem];
}>();

const isMenuOpen = ref(false);

const itemUrl = computed(() => `/collections/${props.slug}/${props.item.id}`);

const menuItems = buildActionMenuItems(props.item, {
  onEdit: (i) => emits("edit", i),
  onRemove: (i) => emits("remove", i),
});

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
