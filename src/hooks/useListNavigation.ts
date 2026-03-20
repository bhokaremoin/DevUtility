import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList} from 'react-native';

interface Identifiable {
  id: string;
}

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
