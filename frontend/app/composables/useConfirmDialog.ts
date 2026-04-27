import { LazyConfirmDialog } from "#components";

interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: "error" | "neutral" | "primary";
}

export const useConfirmDialog = () => {
  const overlay = useOverlay();

  return (options: ConfirmDialogOptions): Promise<boolean> => {
    const modal = overlay.create(LazyConfirmDialog, { destroyOnClose: true });
    return modal.open(options);
  };
};
