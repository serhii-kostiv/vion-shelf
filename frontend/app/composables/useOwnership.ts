// Централізована перевірка чи поточний юзер є власником ресурсу
export const useOwnership = (ownerIdGetter: () => string | undefined) => {
  const { data: userData } = useAuth();

  const isOwner = computed(() => {
    const ownerId = ownerIdGetter();
    if (!ownerId || !userData.value?.id) return false;
    return ownerId === userData.value.id;
  });

  return { isOwner };
};
