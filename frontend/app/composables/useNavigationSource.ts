// Зберігає звідки юзер прийшов на сторінку колекції
// 'public' = з публічних колекцій, 'private' = з моїх колекцій
export const useNavigationSource = () => {
  const source = useState<"public" | "private">("nav-source", () => "public");

  const setSource = (val: "public" | "private") => {
    source.value = val;
  };

  const backRoute = computed(() =>
    source.value === "private"
      ? { label: "Мої колекції", to: "/library" }
      : { label: "Публічні колекції", to: "/" },
  );

  return { source, setSource, backRoute };
};
