<template>
  <UModal
    :title="item ? 'Редагувати елемент' : 'Додати елемент'"
    :description="item ? item.mediaItem.title : 'Введіть дані про медіа'"
  >
    <template #body>
      <UForm :state="form" class="space-y-4" @submit="onSubmit">
        <template v-if="!item">
          <UFormField label="Назва" name="mediaItem.title" required>
            <UInput
              v-model="form.mediaItem.title"
              placeholder="Наприклад: One Piece"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Тип" name="mediaItem.type" required>
            <USelect
              v-model="form.mediaItem.type"
              :items="availableCategoryOptions"
              :disabled="!isMixed"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Постер (URL)" name="mediaItem.posterUrl">
            <UInput
              v-model="form.mediaItem.posterUrl"
              placeholder="https://..."
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center gap-2 text-xs text-gray-400">
            <hr class="flex-1 border-gray-200 dark:border-gray-700" />
            <span>Прогрес</span>
            <hr class="flex-1 border-gray-200 dark:border-gray-700" />
          </div>
        </template>

        <UFormField label="Статус" name="collectionItem.status">
          <USelect
            v-model="form.collectionItem.status"
            :items="statusOptions"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Оцінка (1–10)" name="collectionItem.rating">
            <UInput
              v-model.number="form.collectionItem.rating"
              type="number"
              :min="1"
              :max="10"
              placeholder="—"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Прогрес" name="collectionItem.progress">
            <UInput
              v-model.number="form.collectionItem.progress"
              type="number"
              :min="0"
              placeholder="0"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Нотатки" name="collectionItem.notes">
          <UTextarea
            v-model="form.collectionItem.notes"
            placeholder="Необов'язково"
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Скасувати"
            color="neutral"
            variant="outline"
            @click="emits('close')"
          />
          <UButton
            type="submit"
            :label="item ? 'Зберегти' : 'Додати'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { CollectionItem } from "~/types/collection";

const props = defineProps<{
  collectionId?: string;
  collectionCategory?: string;
  item?: CollectionItem;
}>();

const emits = defineEmits<{
  close: [value?: CollectionItem];
}>();

const loading = ref(false);

const allCategoryOptions = [
  { label: "Книги", value: "BOOKS" },
  { label: "Фільми", value: "MOVIES" },
  { label: "Аніме", value: "ANIME" },
  { label: "Манга", value: "MANGA" },
  { label: "Ігри", value: "GAMES" },
  { label: "Курси", value: "COURSES" },
  { label: "Змішана", value: "MIXED" },
];

const isMixed = computed(() => props.collectionCategory === "MIXED");

const availableCategoryOptions = computed(() =>
  isMixed.value
    ? allCategoryOptions
    : allCategoryOptions.filter((o) => o.value === props.collectionCategory),
);

const form = reactive({
  mediaItem: {
    title: "",
    type: isMixed.value ? "BOOKS" : (props.collectionCategory ?? "BOOKS"),
    externalId: "",
    posterUrl: "",
    metadata: {},
  },
  collectionItem: {
    status: props.item?.status ?? "PLANNED",
    rating: props.item?.rating ?? (null as number | null),
    progress: props.item?.progress ?? 0,
    notes: props.item?.notes ?? "",
  },
});

const statusOptions = [
  { label: "Заплановано", value: "PLANNED" },
  { label: "В процесі", value: "IN_PROGRESS" },
  { label: "Завершено", value: "COMPLETED" },
  { label: "Покинуто", value: "DROPPED" },
];

async function onSubmit() {
  loading.value = true;
  try {
    let result: CollectionItem;

    if (props.item) {
      result = await useApiFetch<CollectionItem>(
        `/collections/items/${props.item.id}`,
        {
          method: "PATCH",
          body: {
            status: form.collectionItem.status,
            rating: form.collectionItem.rating || undefined,
            progress: form.collectionItem.progress,
            notes: form.collectionItem.notes || undefined,
          },
        },
      );
    } else {
      if (!form.mediaItem.externalId) {
        form.mediaItem.externalId = `manual-${Date.now()}`;
      }
      result = await useApiFetch<CollectionItem>(
        `/collections/${props.collectionId}/items`,
        {
          method: "POST",
          body: {
            mediaItem: {
              ...form.mediaItem,
              posterUrl: form.mediaItem.posterUrl || undefined,
            },
            collectionItem: {
              ...form.collectionItem,
              rating: form.collectionItem.rating || undefined,
              notes: form.collectionItem.notes || undefined,
            },
          },
        },
      );
    }

    emits("close", result);
  } finally {
    loading.value = false;
  }
}
</script>
