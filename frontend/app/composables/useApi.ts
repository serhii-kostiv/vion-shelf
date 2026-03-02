export const useApi = <T>(url: string, options: any = {}) => {
  const token = useCookie("auth.token").value;
  const { refreshToken } = useAuthRefresh();

  return useFetch<T>(url, {
    baseURL: "http://localhost:4000",
    ...options,
    watch: false,
    credentials: "include", // Для cookies
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
    async onResponseError({ response, options: fetchOptions }) {
      if (response.status === 401 && !url.includes("/auth/")) {
        // Спробуємо оновити токен
        const refreshed = await refreshToken();

        if (refreshed) {
          // Повторюємо запит з новим токеном
          const newToken = useCookie("auth.token").value;
          if (fetchOptions.headers) {
            if (fetchOptions.headers instanceof Headers) {
              fetchOptions.headers.set("Authorization", `Bearer ${newToken}`);
            } else {
              (fetchOptions.headers as Record<string, string>).Authorization =
                `Bearer ${newToken}`;
            }
          }
        }
      }
    },
  });
};
