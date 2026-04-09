import { LazyCollectionModal } from "#components";
import type { Collection } from "~/types/collection";

export const useCollectionModal = () => {
  const overlay = useOverlay();

  return (collection?: Collection): Promise<Collection | undefined> => {
    const modal = overlay.create(LazyCollectionModal, { destroyOnClose: true });
    return modal.open({ collection });
  };
};
