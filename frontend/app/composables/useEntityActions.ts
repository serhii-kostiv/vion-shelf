import type { DropdownMenuItem } from "@nuxt/ui";

interface EntityActionsOptions<T> {
  onEdit: (item: T) => void;
  onRemove: (item: T) => void;
}

// Будує стандартний масив пунктів дропдауну для будь-якої сутності
export function buildActionMenuItems<T>(
  item: T,
  options: EntityActionsOptions<T>,
): DropdownMenuItem[][] {
  return [
    [
      {
        label: "Редагувати",
        icon: "i-lucide-pencil",
        onSelect: () => options.onEdit(item),
      },
    ],
    [
      {
        label: "Видалити",
        icon: "i-lucide-trash-2",
        color: "error" as const,
        onSelect: () => options.onRemove(item),
      },
    ],
  ];
}
