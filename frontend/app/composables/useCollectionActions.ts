import type { Collection } from "~/types/collection";

export const useCollectionActions = (options: {
  onUpdate?: () => void;
  onRemove?: () => void;
}) => {
  const apiFetch = useApiFetch();
  const openCollectionModal = useCollectionModal();
  const confirm = useConfirmDialog();

  async function editCollection(collection: Collection) {
    const result = await openCollectionModal(collection);
    if (result) options.onUpdate?.();
  }

  async function removeCollection(collection: Collection) {
    const confirmed = await confirm({
      title: "Видалити колекцію?",
      description: `"${collection.title}" та всі її елементи будуть видалені назавжди.`,
      confirmLabel: "Видалити",
      confirmColor: "error",
    });
    if (!confirmed) return;

    await apiFetch(`/collections/${collection.id}`, { method: "DELETE" });
    options.onRemove?.();
  }

  return { editCollection, removeCollection };
};
