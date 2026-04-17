<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-6">
      <UAvatar
        src="https://i.pravatar.cc/150?img=12"
        alt="Аватар користувача"
        size="2xl"
      />
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-semibold">{{ user.name }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ user.email }}
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
          <UIcon
            name="i-lucide-calendar"
            class="inline-block w-3.5 h-3.5 mr-1 align-middle"
          />
          На сайті з {{ user.joinedAt }}
        </p>
      </div>
      <UButton
        icon="i-lucide-pencil"
        label="Редагувати"
        color="neutral"
        variant="soft"
        size="sm"
      />
    </div>

    <USeparator />

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center"
      >
        <UIcon :name="stat.icon" class="w-5 h-5 mx-auto mb-2 text-primary" />
        <p class="text-2xl font-semibold">{{ stat.value }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ stat.label }}
        </p>
      </div>
    </div>

    <!-- Collections -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Мої колекції</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="collection.iconBg"
          >
            <UIcon
              :name="collection.icon"
              class="w-5 h-5"
              :class="collection.iconColor"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ collection.title }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ collection.count }} елементів
            </p>
          </div>
          <UBadge
            :label="collection.category"
            color="neutral"
            variant="soft"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Остання активність</h2>
      <div class="space-y-3">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-start gap-3"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            :class="activity.iconBg"
          >
            <UIcon
              :name="activity.icon"
              class="w-4 h-4"
              :class="activity.iconColor"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm">
              <span class="font-medium">{{ activity.action }}</span>
              <span class="text-gray-500 dark:text-gray-400">
                — {{ activity.target }}</span
              >
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {{ activity.time }}
            </p>
          </div>
          <UBadge
            :label="activity.status"
            :color="activity.statusColor"
            variant="soft"
            size="sm"
          />
        </div>
      </div>
    </div>

    <!-- Favorite Genres -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Улюблені жанри</h2>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="genre in favoriteGenres"
          :key="genre"
          :label="genre"
          color="primary"
          variant="soft"
          size="md"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ title: "Профіль" });
const { data } = useAuth();
console.log("data", data.value);

const user = {
  name: "Олексій Коваленко",
  email: "oleksiy@example.com",
  joinedAt: "Січень 2025",
  avatar: "https://i.pravatar.cc/150?img=12",
};

const stats = [
  { label: "Колекцій", value: 6, icon: "i-lucide-library" },
  { label: "Елементів", value: 142, icon: "i-lucide-layers" },
  { label: "Завершено", value: 89, icon: "i-lucide-check-circle" },
  { label: "В процесі", value: 12, icon: "i-lucide-clock" },
];

const collections = [
  {
    id: 1,
    title: "Улюблені фільми",
    count: 34,
    category: "Фільми",
    icon: "i-lucide-film",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-500",
  },
  {
    id: 2,
    title: "Аніме список",
    count: 58,
    category: "Аніме",
    icon: "i-lucide-tv",
    iconBg: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-500",
  },
  {
    id: 3,
    title: "Книги 2025",
    count: 21,
    category: "Книги",
    icon: "i-lucide-book-open",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-500",
  },
  {
    id: 4,
    title: "Серіали",
    count: 29,
    category: "Серіали",
    icon: "i-lucide-monitor-play",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-500",
  },
];

type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral";

const recentActivity: {
  id: number;
  action: string;
  target: string;
  time: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  status: string;
  statusColor: BadgeColor;
}[] = [
  {
    id: 1,
    action: "Завершив перегляд",
    target: "Inception (2010)",
    time: "2 години тому",
    icon: "i-lucide-check",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-500",
    status: "Завершено",
    statusColor: "success",
  },
  {
    id: 2,
    action: "Додав до списку",
    target: "Dune: Part Two",
    time: "Вчора",
    icon: "i-lucide-plus",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-500",
    status: "Заплановано",
    statusColor: "neutral",
  },
  {
    id: 3,
    action: "Розпочав читання",
    target: "The Pragmatic Programmer",
    time: "3 дні тому",
    icon: "i-lucide-book-open",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-500",
    status: "В процесі",
    statusColor: "info",
  },
  {
    id: 4,
    action: "Покинув",
    target: "Attack on Titan S4",
    time: "Тиждень тому",
    icon: "i-lucide-x",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-500",
    status: "Покинуто",
    statusColor: "error",
  },
];

const favoriteGenres = [
  "Наукова фантастика",
  "Трилер",
  "Аніме",
  "Фентезі",
  "Драма",
  "Пригоди",
  "Психологічне",
];
</script>
