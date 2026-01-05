<template>
  <div class="flex flex-col items-center justify-center">
    <h1 class="text-3xl font-semibold">Profile</h1>
    <p class="mt-4">Welcome, {{ data?.name || data?.email }}!</p>
  </div>
</template>

<script setup lang="ts">
const { status, data } = useAuth();
</script>
