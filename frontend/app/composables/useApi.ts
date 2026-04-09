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

// Викликай в setup() — повертає функцію apiFetch для використання в обробниках подій
export const useApiFetch = () => {
  const toast = useToast();

  return <T>(url: string, options: any = {}): Promise<T> => {
    const token = useCookie("auth.token").value;

    return $fetch<T>(url, {
      baseURL: "http://localhost:4000",
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : "",
      },
      onResponseError({ response }) {
        const data = response._data;
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : (data?.message ?? "Щось пішло не так");

        toast.add({
          title: `Помилка ${response.status}`,
          description: message,
          color: "error",
        });
      },
    });
  };
};
