import { LazyCollectionItemModal } from "#components";
import type { CollectionItem } from "~/types/collection";

export const useCollectionItemModal = () => {
  const overlay = useOverlay();

  return (params: {
    collectionId: string;
    collectionCategory: string;
    item?: CollectionItem;
  }): Promise<CollectionItem | undefined> => {
    const modal = overlay.create(LazyCollectionItemModal, {
      destroyOnClose: true,
    });
    return modal.open(params);
  };
};
