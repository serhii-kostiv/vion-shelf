<template>
  <UModal
    :title="collection ? 'Редагувати колекцію' : 'Нова колекція'"
    :description="
      collection ? 'Змініть дані колекції' : 'Заповніть дані для нової колекції'
    "
  >
    <template #body>
      <UForm :state="form" class="space-y-4" @submit="onSubmit">
        <UFormField label="Назва" name="title" required>
          <UInput
            v-model="form.title"
            placeholder="Наприклад: Прочитати у 2026"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Опис" name="description">
          <UTextarea
            v-model="form.description"
            placeholder="Необов'язково"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Категорія" name="category" required>
          <USelect
            v-model="form.category"
            :items="categoryOptions"
            class="w-full"
          />
        </UFormField>

        <!-- Slug — при створенні опціонально, при редагуванні завжди -->
        <UFormField
          :label="collection ? 'Slug (URL)' : 'Slug (URL, необов\'язково)'"
          name="slug"
          :help="slugHelp"
        >
          <UInput
            v-model="form.slug"
            :placeholder="
              collection
                ? collection.slug
                : 'my-collection (або залиш порожнім)'
            "
            class="w-full"
            :trailing-icon="slugIcon"
            :color="slugFieldColor"
          />
        </UFormField>

        <UFormField name="isPublic">
          <UCheckbox v-model="form.isPublic" label="Публічна колекція" />
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
            :label="collection ? 'Зберегти' : 'Створити'"
            :loading="loading"
            :disabled="collection ? slugChecking || slugTaken : false"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Collection } from "~/types/collection";

const props = defineProps<{
  collection?: Collection;
}>();

const emits = defineEmits<{
  close: [value?: Collection];
}>();

const loading = ref(false);
const apiFetch = useApiFetch();

const form = reactive({
  title: props.collection?.title ?? "",
  description: props.collection?.description ?? "",
  category: props.collection?.category ?? "MIXED",
  isPublic: props.collection?.isPublic ?? false,
  slug: props.collection?.slug ?? "",
});

const categoryOptions = [
  { label: "Книги", value: "BOOKS" },
  { label: "Фільми", value: "MOVIES" },
  { label: "Аніме", value: "ANIME" },
  { label: "Манга", value: "MANGA" },
  { label: "Ігри", value: "GAMES" },
  { label: "Курси", value: "COURSES" },
  { label: "Змішана", value: "MIXED" },
];

// --- Slug availability check ---
const slugChecking = ref(false);
const slugAvailable = ref<boolean | null>(null);
const slugTaken = computed(() => slugAvailable.value === false);

const slugIcon = computed(() => {
  if (slugChecking.value) return "i-lucide-loader-circle";
  if (slugAvailable.value === true) return "i-lucide-check";
  if (slugAvailable.value === false) return "i-lucide-x";
  return undefined;
});

const slugFieldColor = computed(() => {
  if (slugAvailable.value === true) return "success";
  if (slugAvailable.value === false) return "error";
  return undefined;
});

const slugHelp = computed(() => {
  if (slugChecking.value) return "Перевіряємо...";
  if (slugAvailable.value === true) return "Slug доступний";
  if (slugAvailable.value === false) return "Slug вже зайнятий";
  return "Унікальна частина URL колекції";
});

let slugTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => form.slug,
  (val) => {
    // Якщо slug не змінився від оригінального — не перевіряємо
    if (val === props.collection?.slug) {
      slugAvailable.value = null;
      return;
    }

    slugAvailable.value = null;
    if (slugTimer) clearTimeout(slugTimer);

    // При створенні порожній slug — ок (буде згенеровано автоматично)
    if (!val || val.length < 3) return;

    slugChecking.value = true;
    slugTimer = setTimeout(async () => {
      try {
        const excludeParam = props.collection?.id
          ? `?excludeId=${props.collection.id}`
          : "";
        const res = await apiFetch<{ available: boolean }>(
          `/collections/check-slug/${val}${excludeParam}`,
        );
        slugAvailable.value = res.available;
      } finally {
        slugChecking.value = false;
      }
    }, 500);
  },
);

async function onSubmit() {
  loading.value = true;
  try {
    const url = props.collection
      ? `/collections/${props.collection.id}`
      : "/collections";
    const method = props.collection ? "PATCH" : "POST";

    const body = props.collection
      ? {
          ...form,
          slug: form.slug !== props.collection.slug ? form.slug : undefined,
        }
      : {
          ...form,
          slug: form.slug || undefined,
        };

    const result = await apiFetch<Collection>(url, { method, body });
    emits("close", result);
  } finally {
    loading.value = false;
  }
}
</script>
