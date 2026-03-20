/**
 * @file screens/ClipCopyScreen.tsx
 * @description Master-detail screen for viewing and copying clipboard history.
 *
 * Architecture Role: One of three top-level screens rendered by `App.tsx`.
 * Owns the two-pane layout (master list + detail editor) and exposes a
 * `ScreenHandle` via `forwardRef`/`useImperativeHandle` so `App.tsx` can drive
 * keyboard actions (copy, escape, arrow navigation) without lifting state.
 *
 * Data is provided entirely through props from `useClipboardHistory` in `App.tsx`.
 */

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {ClipboardItem, ScreenHandle} from '../types';
import {colors, spacing, typography} from '../theme';
import {useListNavigation} from '../hooks';
import {ClipMasterRow, ClipDetailView} from '../components';

/** Props injected from `App.tsx` via the `useClipboardHistory` return value. */
interface ClipCopyScreenProps {
  /** Ordered clipboard history entries (newest first). */
  history: ClipboardItem[];
  /** ID of the item currently showing copy feedback, or `null`. */
  copiedId: string | null;
  /** Copies an item (or draft override) and triggers copy feedback. */
  copyToClipboard: (item: ClipboardItem, textOverride?: string) => void;
  /** Persists an edited clipboard item text. */
  updateItemText: (id: string, text: string) => void;
  /** Clears the entire clipboard history (called after confirmation). */
  clearHistory: () => void;
}

export const ClipCopyScreen = forwardRef<ScreenHandle, ClipCopyScreenProps>(
  function ClipCopyScreen(
    {history, copiedId, copyToClipboard, updateItemText},
    ref,
  ) {
    const {
      selectedId,
      setSelectedId,
      selectedItem,
      flatListRef,
      isDetailFocused,
      navigate,
      onViewableItemsChanged,
      viewabilityConfig,
    } = useListNavigation(history);

    useImperativeHandle(
      ref,
      () => ({
        copySelected: () => {
          if (selectedItem) {
            copyToClipboard(selectedItem);
          }
        },
        handleEscape: () => {
          if (selectedId) {
            setSelectedId(null);
            return true;
          }
          return false;
        },
        navigateUp: () => navigate(-1),
        navigateDown: () => navigate(1),
      }),
      [selectedItem, selectedId, setSelectedId, copyToClipboard, navigate],
    );

    const renderItem = useCallback(
      ({item}: {item: ClipboardItem}) => (
        <ClipMasterRow
          item={item}
          isSelected={selectedId === item.id}
          isCopied={copiedId === item.id}
          onSelect={setSelectedId}
          onCopy={copyToClipboard}
        />
      ),
      [selectedId, setSelectedId, copiedId, copyToClipboard],
    );

    const keyExtractor = useCallback((item: ClipboardItem) => item.id, []);

    return (
      <View style={styles.container}>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No clipboard history yet</Text>
            <Text style={styles.emptySubtitle}>
              Copy something and it will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.splitPane}>
            <View style={styles.masterPane}>
              <FlatList
                ref={flatListRef}
                data={history}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.masterList}
                ItemSeparatorComponent={Separator}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollToIndexFailed={({index}) => {
                  flatListRef.current?.scrollToOffset({
                    offset: index * 56,
                    animated: false,
                  });
                }}
              />
            </View>
            <View style={styles.detailPane}>
              {selectedItem ? (
                <ClipDetailView
                  item={selectedItem}
                  isCopied={copiedId === selectedItem.id}
                  onCopy={copyToClipboard}
                  onUpdate={updateItemText}
                  onEditorFocusChange={focused => {
                    isDetailFocused.current = focused;
                  }}
                />
              ) : (
                <DetailPlaceholder />
              )}
            </View>
          </View>
        )}
      </View>
    );
  },
);

function Separator() {
  return <View style={styles.separator} />;
}

function DetailPlaceholder() {
  return (
    <View style={styles.detailPlaceholder}>
      <Text style={styles.detailPlaceholderText}>
        Select an item to view its contents
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  splitPane: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    flex: 0.35,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  detailPane: {
    flex: 0.65,
  },
  masterList: {
    paddingVertical: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  detailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailPlaceholderText: {
    ...typography.caption,
    color: colors.text.placeholder,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: spacing.huge,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.tertiary,
    marginBottom: spacing.xs + spacing.xxs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.text.placeholder,
  },
});
