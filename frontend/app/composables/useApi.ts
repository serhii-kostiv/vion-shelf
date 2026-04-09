export const useApi = <T>(url: string, options: any = {}) => {
  const token = useCookie("auth.token").value;
  const { refreshToken } = useAuthRefresh();

  return useFetch<T>(url, {
    baseURL: "http://localhost:4000",
    ...options,
    watch: false,
    credentials: "include",
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
    async onResponseError({ response, options: fetchOptions }) {
      if (response.status === 401 && !url.includes("/auth/")) {
        const refreshed = await refreshToken();

        if (refreshed) {
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

// Для мутацій всередині компонентів (POST/PATCH/DELETE)
// useFetch не можна викликати після монтування — використовуй цей метод
export const useApiFetch = <T>(url: string, options: any = {}): Promise<T> => {
  const token = useCookie("auth.token").value;

  return $fetch<T>(url, {
    baseURL: "http://localhost:4000",
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};
