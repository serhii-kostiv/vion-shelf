export default defineNuxtPlugin(async () => {
  const { status, getSession } = useAuth();
  const { refreshToken } = useAuthRefresh();

  // Перевіряємо токен при завантаженні
  if (status.value === "authenticated") {
    const tokenCookie = useCookie("auth.token");

    if (tokenCookie.value) {
      // Перевіряємо чи токен ще валідний
      try {
        await getSession();
      } catch (error) {
        // Якщо токен невалідний, спробуємо refresh
        await refreshToken();
      }
    }
  }

  // Встановлюємо інтервал для періодичного refresh (кожні 45 хвилин)
  if (import.meta.client) {
    setInterval(
      async () => {
        if (status.value === "authenticated") {
          await refreshToken();
        }
      },
      45 * 60 * 1000,
    ); // 45 хвилин (access token живе 1 годину)
  }
});
