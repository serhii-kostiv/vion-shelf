<template>
  <UModal
    :title="title"
    :description="description"
    :dismissible="false"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        label="Скасувати"
        color="neutral"
        variant="outline"
        @click="emits('close', false)"
      />
      <UButton
        :label="confirmLabel"
        :color="confirmColor"
        @click="emits('close', true)"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: "error" | "neutral" | "primary";
}>();

const emits = defineEmits<{
  close: [value: boolean];
}>();
</script>
