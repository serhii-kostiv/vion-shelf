// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@sidebase/nuxt-auth"],
  css: ["~/assets/css/main.css"],
  auth: {
    // 1. Вказуємо тип провайдера
    provider: {
      type: "local",

      // 2. Налаштування ендпоінтів твого NestJS
      endpoints: {
        signIn: { path: "/auth/login", method: "post" },
        signOut: { path: "/auth/logout", method: "post" },
        signUp: { path: "/auth/register", method: "post" },
        // Дуже важливо: цей метод викликається автоматично після логіну
        // або при оновленні сторінки, щоб отримати дані юзера
        getSession: { path: "/auth/profile", method: "get" },
      },

      // 3. Налаштування токена
      token: {
        signInResponseTokenPointer: "/access_token", // де в JSON від NestJS лежить токен
        type: "Bearer",
        cookieName: "auth.token",
        headerName: "Authorization",
        maxAgeInSeconds: 86400, // 24 годин (має збігатися з expiresIn у NestJS)
      },

      // 4. Налаштування сесії (дані юзера)
      session: {
        dataType: {
          userId: "string | number",
          name: "string",
          email: "string",
        },
      },
    },

    // 5. Глобальний захист сторінок
    globalAppMiddleware: true, // Всі сторінки закриті за замовчуванням

    // Базовий URL твого API
    baseURL: "http://localhost:4000",
  },
});
