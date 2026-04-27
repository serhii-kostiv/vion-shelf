import type { CollectionItem } from "~/types/collection";

export const useCollectionItemActions = (options: {
  collectionId: string;
  collectionCategory: string;
  onUpdate?: () => void;
  onRemove?: (item: CollectionItem) => void;
}) => {
  const apiFetch = useApiFetch();
  const openCollectionItemModal = useCollectionItemModal();
  const confirm = useConfirmDialog();

  async function editItem(item: CollectionItem) {
    const result = await openCollectionItemModal({
      collectionId: options.collectionId,
      collectionCategory: options.collectionCategory,
      item,
    });
    if (result) options.onUpdate?.();
  }

  async function removeItem(item: CollectionItem) {
    const confirmed = await confirm({
      title: "Видалити елемент?",
      description: `"${item.mediaItem.title}" буде видалено з колекції.`,
      confirmLabel: "Видалити",
      confirmColor: "error",
    });
    if (!confirmed) return;

    await apiFetch(`/collections/items/${item.id}`, { method: "DELETE" });
    options.onRemove?.(item);
  }

  return { editItem, removeItem };
};
