<template>
  <UModal
    :title="item ? 'Редагувати елемент' : 'Додати елемент'"
    :description="item ? item.mediaItem.title : 'Введіть дані про медіа'"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Назва" name="mediaItem.title" required>
          <UInput
            v-model="form.mediaItem.title"
            placeholder="Наприклад: One Piece"
            class="w-full"
          />
        </UFormField>

        <template v-if="!item">
          <UFormField label="Тип" name="mediaItem.type" required>
            <USelect
              v-model="form.mediaItem.type"
              :items="availableCategoryOptions"
              :disabled="!isMixed"
              class="w-full"
            />
          </UFormField>
        </template>

        <UFormField label="Постер (URL)" name="mediaItem.posterUrl">
          <UInput
            v-model="form.mediaItem.posterUrl"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <!-- Динамічні metadata поля залежно від типу -->
        <template v-if="metadataFields.length > 0 || isCustomType">
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <hr class="flex-1 border-gray-200 dark:border-gray-700" />
            <span>Деталі</span>
            <hr class="flex-1 border-gray-200 dark:border-gray-700" />
          </div>

          <!-- Фіксовані поля для відомих типів -->
          <template v-if="!isCustomType">
            <div class="grid grid-cols-2 gap-4">
              <template v-for="field in metadataFields" :key="field.key">
                <UFormField
                  :label="field.label"
                  :name="`mediaItem.metadata.${field.key}`"
                  :class="field.fullWidth ? 'col-span-2' : ''"
                >
                  <UInput
                    v-model="form.mediaItem.metadata[field.key]"
                    :placeholder="field.placeholder"
                    :type="field.type ?? 'text'"
                    class="w-full"
                  />
                </UFormField>
              </template>
            </div>
          </template>

          <!-- Key-value редактор для кастомного типу -->
          <template v-else>
            <div class="space-y-2">
              <div
                v-for="(entry, index) in customMetadataEntries"
                :key="index"
                class="flex gap-2 items-center"
              >
                <UInput
                  v-model="entry.key"
                  placeholder="Назва поля"
                  class="flex-1"
                />
                <UInput
                  v-model="entry.value"
                  placeholder="Значення"
                  class="flex-1"
                />
                <UButton
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  aria-label="Видалити поле"
                  @click="removeCustomEntry(index)"
                />
              </div>
              <UButton
                label="Додати поле"
                icon="i-lucide-plus"
                color="neutral"
                variant="outline"
                size="sm"
                @click="addCustomEntry"
              />
            </div>
          </template>
        </template>

        <div class="flex items-center gap-2 text-xs text-gray-400">
          <hr class="flex-1 border-gray-200 dark:border-gray-700" />
          <span>Прогрес</span>
          <hr class="flex-1 border-gray-200 dark:border-gray-700" />
        </div>

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
import * as z from "zod";
import type { CollectionItem } from "~/types/collection";

interface MetadataField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  fullWidth?: boolean;
}

const METADATA_FIELDS: Record<string, MetadataField[]> = {
  BOOKS: [
    {
      key: "authors",
      label: "Автори",
      placeholder: "Ім'я автора",
      fullWidth: true,
    },
    { key: "publisher", label: "Видавництво", placeholder: "Видавництво" },
    {
      key: "pageCount",
      label: "Кількість сторінок",
      placeholder: "350",
      type: "number",
    },
    {
      key: "publishedYear",
      label: "Рік видання",
      placeholder: "2023",
      type: "number",
    },
    {
      key: "genres",
      label: "Жанри",
      placeholder: "Фентезі, Пригоди",
      fullWidth: true,
    },
  ],
  MOVIES: [
    { key: "director", label: "Режисер", placeholder: "Ім'я режисера" },
    {
      key: "releaseYear",
      label: "Рік виходу",
      placeholder: "2023",
      type: "number",
    },
    {
      key: "duration",
      label: "Тривалість (хв)",
      placeholder: "120",
      type: "number",
    },
    {
      key: "genres",
      label: "Жанри",
      placeholder: "Драма, Трилер",
      fullWidth: true,
    },
  ],
  ANIME: [
    { key: "studio", label: "Студія", placeholder: "Mappa, Ufotable..." },
    {
      key: "episodes",
      label: "Кількість епізодів",
      placeholder: "24",
      type: "number",
    },
    {
      key: "releaseYear",
      label: "Рік виходу",
      placeholder: "2023",
      type: "number",
    },
    {
      key: "genres",
      label: "Жанри",
      placeholder: "Сьонен, Екшн",
      fullWidth: true,
    },
  ],
  MANGA: [
    { key: "author", label: "Автор", placeholder: "Ім'я автора" },
    { key: "volumes", label: "Томів", placeholder: "20", type: "number" },
    {
      key: "releaseYear",
      label: "Рік початку",
      placeholder: "2010",
      type: "number",
    },
    {
      key: "genres",
      label: "Жанри",
      placeholder: "Сьонен, Романтика",
      fullWidth: true,
    },
  ],
  GAMES: [
    { key: "developer", label: "Розробник", placeholder: "FromSoftware..." },
    {
      key: "releaseYear",
      label: "Рік виходу",
      placeholder: "2023",
      type: "number",
    },
    { key: "platform", label: "Платформа", placeholder: "PC, PS5, Switch" },
    {
      key: "genres",
      label: "Жанри",
      placeholder: "RPG, Action",
      fullWidth: true,
    },
  ],
  COURSES: [
    { key: "instructor", label: "Викладач", placeholder: "Ім'я викладача" },
    { key: "platform", label: "Платформа", placeholder: "Udemy, Coursera..." },
    {
      key: "duration",
      label: "Тривалість (год)",
      placeholder: "10",
      type: "number",
    },
    { key: "language", label: "Мова", placeholder: "Українська, English" },
  ],
};

const props = defineProps<{
  collectionId?: string;
  collectionCategory?: string;
  item?: CollectionItem;
}>();

const emits = defineEmits<{
  close: [value?: CollectionItem];
}>();

const loading = ref(false);
const apiFetch = useApiFetch();

const allCategoryOptions = [
  { label: "Книги", value: "BOOKS" },
  { label: "Фільми", value: "MOVIES" },
  { label: "Аніме", value: "ANIME" },
  { label: "Манга", value: "MANGA" },
  { label: "Ігри", value: "GAMES" },
  { label: "Курси", value: "COURSES" },
  { label: "Інше", value: "MIXED" },
];

const isMixed = computed(() => props.collectionCategory === "MIXED");

const availableCategoryOptions = computed(() =>
  isMixed.value
    ? allCategoryOptions
    : allCategoryOptions.filter((o) => o.value === props.collectionCategory),
);

const form = reactive({
  mediaItem: {
    title: props.item?.mediaItem.title ?? "",
    type:
      props.item?.mediaItem.type ??
      (isMixed.value ? "BOOKS" : (props.collectionCategory ?? "BOOKS")),
    externalId: "",
    posterUrl: props.item?.mediaItem.posterUrl ?? "",
    metadata: (props.item?.mediaItem.metadata ?? {}) as Record<
      string,
      string | number
    >,
  },
  collectionItem: {
    status: props.item?.status ?? "PLANNED",
    rating: props.item?.rating ?? (null as number | null),
    progress: props.item?.progress ?? 0,
    notes: props.item?.notes ?? "",
  },
});

// Поля metadata залежно від поточного типу
const metadataFields = computed<MetadataField[]>(
  () => METADATA_FIELDS[form.mediaItem.type] ?? [],
);

const isCustomType = computed(
  () => !METADATA_FIELDS[form.mediaItem.type] && form.mediaItem.type !== "",
);

// Key-value пари для кастомного типу
const customMetadataEntries = ref<{ key: string; value: string }[]>(
  props.item && isCustomType.value
    ? Object.entries(props.item.mediaItem.metadata ?? {}).map(
        ([key, value]) => ({
          key,
          value: String(value),
        }),
      )
    : [],
);

function addCustomEntry() {
  customMetadataEntries.value.push({ key: "", value: "" });
}

function removeCustomEntry(index: number) {
  customMetadataEntries.value.splice(index, 1);
}

// Скидаємо metadata при зміні типу
watch(
  () => form.mediaItem.type,
  () => {
    form.mediaItem.metadata = {};
    customMetadataEntries.value = [];
  },
);

const statusOptions = [
  { label: "Заплановано", value: "PLANNED" },
  { label: "В процесі", value: "IN_PROGRESS" },
  { label: "Завершено", value: "COMPLETED" },
  { label: "Покинуто", value: "DROPPED" },
];

const schema = z.object({
  mediaItem: z.object({
    title: z.string().min(1, "Назва обов'язкова").max(255),
    type: z.string().min(1, "Тип обов'язковий"),
    posterUrl: z
      .string()
      .refine((v) => v === "" || z.url().safeParse(v).success, {
        message: "Невалідний URL",
      })
      .optional(),
    externalId: z.string().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number()]))
      .optional(),
  }),
  collectionItem: z.object({
    status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "DROPPED"]),
    rating: z.number().min(1).max(10).nullable().optional(),
    progress: z.number().min(0).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

// Фільтруємо порожні metadata поля перед відправкою
function buildMetadata(): Record<string, string | number> {
  if (isCustomType.value) {
    return Object.fromEntries(
      customMetadataEntries.value
        .filter(({ key, value }) => key.trim() !== "" && value.trim() !== "")
        .map(({ key, value }) => [key.trim(), value.trim()]),
    );
  }
  return Object.fromEntries(
    Object.entries(form.mediaItem.metadata).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );
}

async function onSubmit() {
  loading.value = true;
  try {
    let result: CollectionItem;

    if (props.item) {
      result = await apiFetch<CollectionItem>(
        `/collections/items/${props.item.id}`,
        {
          method: "PATCH",
          body: {
            status: form.collectionItem.status,
            rating: form.collectionItem.rating || undefined,
            progress: form.collectionItem.progress,
            notes: form.collectionItem.notes || undefined,
            title: form.mediaItem.title || undefined,
            posterUrl: form.mediaItem.posterUrl || undefined,
            metadata: buildMetadata(),
          },
        },
      );
    } else {
      if (!form.mediaItem.externalId) {
        form.mediaItem.externalId = `manual-${Date.now()}`;
      }
      result = await apiFetch<CollectionItem>(
        `/collections/${props.collectionId}/items`,
        {
          method: "POST",
          body: {
            mediaItem: {
              ...form.mediaItem,
              posterUrl: form.mediaItem.posterUrl || undefined,
              metadata: buildMetadata(),
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
