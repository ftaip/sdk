import { useCallback, useState } from "react";

/**
 * Generic hook for managing an editable list with add, update, remove operations.
 * Useful for objections, line items, action items, or any list the user builds.
 *
 * @example
 * ```tsx
 * const { items, addItem, updateItem, removeItem } = useEditableList<Objection>(
 *   { paragraph: '', basis: '', notes: '' }
 * );
 * ```
 */
export function useEditableList<T extends Record<string, unknown>>(
  defaultItem: T,
  initial?: T[] | null,
): {
  items: T[] | null;
  setItems: (items: T[]) => void;
  clearItems: () => void;
  addItem: () => void;
  updateItem: <K extends keyof T>(index: number, field: K, value: T[K]) => void;
  removeItem: (index: number) => void;
} {
  const [items, setItemsState] = useState<T[] | null>(initial ?? null);

  const setItems = useCallback((next: T[]) => {
    setItemsState(next);
  }, []);

  const clearItems = useCallback(() => {
    setItemsState(null);
  }, []);

  const addItem = useCallback(() => {
    setItemsState((prev) => [...(prev ?? []), { ...defaultItem }]);
  }, [defaultItem]);

  const updateItem = useCallback(
    <K extends keyof T>(index: number, field: K, value: T[K]) => {
      setItemsState((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setItemsState((prev) => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return { items, setItems, clearItems, addItem, updateItem, removeItem };
}
