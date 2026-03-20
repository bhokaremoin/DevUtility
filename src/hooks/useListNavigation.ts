/**
 * @file hooks/useListNavigation.ts
 * @description React hook that manages keyboard-driven list selection and
 * scroll-into-view behavior for master-detail list screens.
 *
 * Architecture Role: Reusable navigation primitive shared by both
 * `ClipCopyScreen` and `SnippetManagerScreen`. Tracks the selected item ID,
 * exposes a `navigate` function for arrow-key movement, and integrates with
 * `FlatList`'s viewability API to scroll only when the target item is
 * off-screen.
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList} from 'react-native';

/** Minimal constraint: list items must have a unique string `id`. */
interface Identifiable {
  id: string;
}

/**
 * Manages keyboard-driven selection and scroll-to for a `FlatList`.
 *
 * @param items - The array currently rendered by the list.
 * @returns An object containing:
 *   - `selectedId` / `setSelectedId` — currently selected item ID and setter.
 *   - `selectedItem` — the full item object for the selected ID, or `null`.
 *   - `flatListRef` — ref to attach to the `FlatList` for scroll control.
 *   - `isDetailFocused` — ref that screens set `true` when the detail-pane
 *     editor is focused, suppressing arrow-key list navigation.
 *   - `navigate(delta)` — moves selection by `+1` (down) or `-1` (up).
 *   - `onViewableItemsChanged` / `viewabilityConfig` — pass to `FlatList` so
 *     the hook knows which items are currently visible before scrolling.
 */
export function useListNavigation<T extends Identifiable>(items: T[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isDetailFocused = useRef(false);
  const visibleItemIds = useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    visibleItemIds.current = new Set(viewableItems.map((vi: any) => vi.key));
  }).current;

  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 90}).current;

  const navigate = useCallback(
    (delta: 1 | -1) => {
      if (items.length === 0 || isDetailFocused.current) {
        return;
      }
      const idx = selectedId
        ? items.findIndex(item => item.id === selectedId)
        : -1;
      const newIdx = Math.max(
        0,
        Math.min(items.length - 1, (idx === -1 ? 0 : idx) + delta),
      );
      const newId = items[newIdx].id;
      setSelectedId(newId);
      if (!visibleItemIds.current.has(newId)) {
        flatListRef.current?.scrollToIndex({
          index: newIdx,
          animated: false,
          viewPosition: delta === 1 ? 1 : 0,
        });
      }
    },
    [items, selectedId],
  );

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = items.some(item => item.id === selectedId);
    if (!selectedId || !stillExists) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selectedItem = useMemo(
    () => items.find(item => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return {
    selectedId,
    setSelectedId,
    selectedItem,
    flatListRef,
    isDetailFocused,
    navigate,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}
