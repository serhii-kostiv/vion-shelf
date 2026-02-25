export const useApi = <T>(url: string, options: any = {}) => {
  const token = useCookie("auth.token").value;

  // const config = useRuntimeConfig();

  return useFetch<T>(url, {
    baseURL: "http://localhost:4000",
    ...options,
    watch: false,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
    // onResponseError({ response }) {
    //   if (response.status === 401) {
    //     // Якщо токен невалідний — виходимо
    //     //signOut({ callbackUrl: "/login" });
    //   }
    // },
  });
};
