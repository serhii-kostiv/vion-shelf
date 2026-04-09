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

const form = reactive({
  title: props.collection?.title ?? "",
  description: props.collection?.description ?? "",
  category: props.collection?.category ?? "MIXED",
  isPublic: props.collection?.isPublic ?? false,
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

async function onSubmit() {
  loading.value = true;
  try {
    const url = props.collection
      ? `/collections/${props.collection.id}`
      : "/collections";
    const method = props.collection ? "PATCH" : "POST";

    const result = await useApiFetch<Collection>(url, { method, body: form });
    emits("close", result);
  } finally {
    loading.value = false;
  }
}
</script>
""
