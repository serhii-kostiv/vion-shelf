---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*.{vue,ts,js}"
---

# Frontend Best Practices (Nuxt 4 + Vue 3)

## Структура Проекту (Nuxt 4)

### Нова Організація Папок

```
frontend/
  ├── app/                    # Основний код додатку
  │   ├── components/         # Vue компоненти
  │   ├── composables/        # Composable functions
  │   ├── layouts/            # Layout компоненти
  │   ├── pages/              # File-based routing
  │   ├── middleware/         # Route middleware
  │   └── app.vue             # Root component
  ├── server/                 # Server-side код
  │   ├── api/                # API endpoints
  │   ├── middleware/         # Server middleware
  │   └── utils/              # Server utilities
  ├── public/                 # Статичні файли
  └── nuxt.config.ts          # Конфігурація
```

### Auto-imports

Nuxt 4 автоматично імпортує:

- Composables з `composables/`
- Components з `components/`
- Utils з `utils/`
- Vue APIs (ref, computed, watch, тощо)

## Композиційний API (Composition API)

### Структура Composable

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials: LoginDto) => {
    // Логіка логіну
  };

  return {
    user: readonly(user),
    isAuthenticated,
    login,
  };
};
```

### Правила Composables

- Префікс `use` для всіх composables
- Повертай тільки те, що потрібно зовні
- Використовуй `readonly()` для захисту стану
- Один composable = одна відповідальність

## Компоненти

### Single File Components (SFC)

Порядок блоків у `.vue` файлах завжди такий: `<template>` → `<script>` → `<style>`.

```vue
<template>
  <!-- Шаблон -->
</template>

<script setup lang="ts">
// Логіка компонента
const props = defineProps<{
  title: string;
  items: Item[];
}>();

const emit = defineEmits<{
  select: [item: Item];
}>();
</script>

<style scoped>
/* Стилі */
</style>
```

### Принципи Компонентів

- **Маленькі та фокусовані** - один компонент = одна відповідальність
- **Reusable** - компонент має бути перевикористовуваним
- **Props down, Events up** - дані вниз, події вгору
- **Scoped styles** - завжди використовуй scoped для стилів

### Іменування

- PascalCase для компонентів: `UserProfile.vue`
- kebab-case в шаблонах: `<user-profile />`
- Префікси для типів: `Base`, `App`, `The` (TheHeader, BaseButton)

## Управління Станом

### Local State (ref/reactive)

Для стану компонента:

```typescript
const count = ref(0);
const user = reactive({ name: "", email: "" });
```

### Composables для Shared State

Для стану між компонентами:

```typescript
// composables/useCart.ts
const items = ref<CartItem[]>([]);

export const useCart = () => {
  const addItem = (item: CartItem) => {
    items.value.push(item);
  };

  return { items: readonly(items), addItem };
};
```

### Pinia (якщо потрібно)

Для складного глобального стану:

- Автентифікація
- Складні форми
- Кешування даних

## Робота з API

### Nuxt $fetch

```typescript
// Використовуй $fetch для API запитів
const data = await $fetch("/api/users", {
  method: "POST",
  body: { name: "John" },
});
```

### Composable для API

```typescript
// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig();

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      // Додай токен
      const token = useCookie("token");
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        };
      }
    },
    onResponseError({ response }) {
      // Глобальна обробка помилок
      if (response.status === 401) {
        navigateTo("/login");
      }
    },
  });

  return { apiFetch };
};
```

### useFetch vs useAsyncData

- `useFetch` - для простих GET запитів
- `useAsyncData` - для складної логіки або не-fetch запитів
- Обидва підтримують SSR та автоматичний refetch

## Routing

### File-based Routing

```
pages/
  ├── index.vue           → /
  ├── about.vue           → /about
  ├── users/
  │   ├── index.vue       → /users
  │   └── [id].vue        → /users/:id
  └── [...slug].vue       → catch-all route
```

### Navigation

```typescript
// Програмна навігація
await navigateTo('/users');
await navigateTo({ name: 'users-id', params: { id: 1 } });

// В шаблоні
<NuxtLink to="/users">Users</NuxtLink>
```

### Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated.value) {
    return navigateTo("/login");
  }
});
```

## Форми та Валідація

### v-model для Two-way Binding

```vue
<script setup lang="ts">
const form = reactive({
  email: "",
  password: "",
});
</script>

<template>
  <input v-model="form.email" type="email" />
  <input v-model="form.password" type="password" />
</template>
```

### Валідація

Використовуй бібліотеки:

- Vuelidate
- VeeValidate
- Zod (для TypeScript-first валідації)

## Performance

### Lazy Loading

```typescript
// Lazy load компонентів
const HeavyComponent = defineAsyncComponent(
  () => import("~/components/HeavyComponent.vue"),
);

// Lazy load routes (автоматично в Nuxt)
```

### v-show vs v-if

- `v-if` - коли елемент рідко показується
- `v-show` - коли елемент часто toggle

### Computed vs Methods

- `computed` - для derived state (кешується)
- `methods` - для дій та обробників подій

### Key для Lists

ЗАВЖДИ використовуй `:key` в `v-for`:

```vue
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

## TypeScript

### Типізація Props

```typescript
interface Props {
  title: string;
  count?: number;
  items: Item[];
}

const props = defineProps<Props>();
```

### Типізація Emits

```typescript
const emit = defineEmits<{
  update: [value: string];
  delete: [id: number];
}>();
```

### Типізація Refs

```typescript
const count = ref<number>(0);
const user = ref<User | null>(null);
```

## Accessibility

### Семантичний HTML

- Використовуй правильні теги: `<button>`, `<nav>`, `<main>`, `<article>`
- НЕ використовуй `<div>` для кнопок

### ARIA Attributes

```vue
<button aria-label="Close dialog" aria-expanded="false" @click="close">
  <Icon name="x" />
</button>
```

### Keyboard Navigation

- Всі інтерактивні елементи мають бути доступні з клавіатури
- Tab order має бути логічним
- Escape для закриття модалів

## Error Handling

### Try-Catch для Async

```typescript
const fetchData = async () => {
  try {
    const data = await $fetch("/api/data");
    return data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    // Показати toast або error message
  }
};
```

### Error Boundaries

Використовуй `onErrorCaptured` для обробки помилок компонентів:

```typescript
onErrorCaptured((err, instance, info) => {
  console.error("Component error:", err);
  return false; // Не propagate далі
});
```

## SEO

### Meta Tags

```typescript
// В компоненті або сторінці
useHead({
  title: "Page Title",
  meta: [{ name: "description", content: "Page description" }],
});

// Або useSeoMeta для кращої типізації
useSeoMeta({
  title: "Page Title",
  description: "Page description",
  ogImage: "/og-image.jpg",
});
```

## Стилізація

### Scoped Styles

```vue
<style scoped>
/* Стилі застосовуються тільки до цього компонента */
.button {
  background: blue;
}
</style>
```

### CSS Modules

```vue
<style module>
.button {
  background: blue;
}
</style>

<template>
  <button :class="$style.button">Click</button>
</template>
```

### Tailwind CSS (якщо використовується)

- Utility-first підхід
- Використовуй `@apply` для повторюваних патернів
- Створюй компоненти для складних UI елементів
