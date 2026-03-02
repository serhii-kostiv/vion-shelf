export const useAuthRefresh = () => {
  const { signOut, token, getSession } = useAuth();

  const refreshToken = async () => {
    try {
      const response = await $fetch<{ access_token: string; user: any }>(
        "/auth/refresh",
        {
          baseURL: "http://localhost:4000",
          method: "POST",
          credentials: "include", // Важливо для cookies
        },
      );

      if (response?.access_token) {
        // Оновлюємо токен в cookie
        const tokenCookie = useCookie("auth.token");
        tokenCookie.value = response.access_token;

        // Оновлюємо сесію
        await getSession();

        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      await signOut({ callbackUrl: "/login" });
      return false;
    }
  };

  return {
    refreshToken,
  };
};
