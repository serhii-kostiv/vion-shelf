<template>
  <div
    class="relative group block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
  >
    <NuxtLink
      :to="`${basePath ?? '/collections'}/${collection.slug}`"
      class="block"
      @click="onNavigate"
    >
      <div class="flex items-start justify-between gap-2 pr-6">
        <h3 class="font-medium truncate">{{ collection.title }}</h3>
        <UBadge
          :label="collection.category"
          variant="soft"
          size="sm"
          class="shrink-0"
        />
      </div>

      <p
        v-if="collection.description"
        class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
      >
        {{ collection.description }}
      </p>

      <div
        class="mt-3 flex items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500"
      >
        <div class="flex gap-3">
          <span>{{ collection.itemsCount }} елементів</span>
          <UBadge
            :label="collection.isPublic ? 'Публічна' : 'Приватна'"
            variant="soft"
            size="sm"
            :color="collection.isPublic ? 'primary' : 'warning'"
            class="shrink-0"
          />
        </div>
        <div v-if="!isOwner">Власник: {{ collection.user.name }}</div>
      </div>
    </NuxtLink>

    <div
      v-if="isOwner"
      class="absolute top-3 right-3 transition-opacity"
      :class="isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
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
            variant="ghost"
            aria-label="Дії з колекцією"
          />
        </UTooltip>
      </UDropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection } from "~/types/collection";

const props = defineProps<{
  collection: Collection;
  isOwner?: boolean;
  source?: "public" | "private";
  basePath?: string;
}>();

const emits = defineEmits<{
  edit: [collection: Collection];
  remove: [collection: Collection];
}>();

const isMenuOpen = ref(false);
const { setSource } = useNavigationSource();

function onNavigate() {
  if (props.source) setSource(props.source);
}

const menuItems = buildActionMenuItems(props.collection, {
  onEdit: (c) => emits("edit", c),
  onRemove: (c) => emits("remove", c),
});
</script>
