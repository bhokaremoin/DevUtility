import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ClipboardItem} from '../types';
import {
  colors,
  spacing,
  typography,
  radii,
  MIN_TAP_TARGET,
} from '../theme';

const MAX_DISPLAY_LENGTH = 120;

interface ClipCopyScreenProps {
  history: ClipboardItem[];
  copiedId: string | null;
  copyToClipboard: (item: ClipboardItem) => void;
  clearHistory: () => void;
}

function MasterRow({
  item,
  isSelected,
  isCopied,
  onSelect,
  onCopy,
}: {
  item: ClipboardItem;
  isSelected: boolean;
  isCopied: boolean;
  onSelect: (id: string) => void;
  onCopy: (item: ClipboardItem) => void;
}) {
  const displayText =
    item.text.length > MAX_DISPLAY_LENGTH
      ? item.text.slice(0, MAX_DISPLAY_LENGTH) + '…'
      : item.text;

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={() => onSelect(item.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{selected: isSelected}}
      accessibilityLabel={`Clipboard item: ${displayText}`}>
      <Text style={styles.rowText} numberOfLines={2}>
        {displayText}
      </Text>
      <TouchableOpacity
        style={[styles.rowCopyBtn, isCopied && styles.rowCopyBtnCopied]}
        onPress={() => onCopy(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          isCopied ? 'Copied to clipboard' : 'Copy to clipboard'
        }>
        <Text
          style={[
            styles.rowCopyText,
            isCopied && styles.rowCopyTextCopied,
          ]}>
          {isCopied ? '✓' : 'Copy'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function DetailView({
  item,
  isCopied,
  onCopy,
}: {
  item: ClipboardItem;
  isCopied: boolean;
  onCopy: (item: ClipboardItem) => void;
}) {
  const formattedTime = useMemo(
    () => new Date(item.timestamp).toLocaleString(),
    [item.timestamp],
  );

  return (
    <View style={styles.detail}>
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator
      >
        <Text style={styles.detailTimestamp}>{formattedTime}</Text>
        <View style={styles.detailCodeBlock}>
          <Text style={styles.detailCode} selectable>
            {item.text}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.detailFooter}>
        <TouchableOpacity
          style={[styles.detailCopyBtn, isCopied && styles.detailCopyBtnCopied]}
          onPress={() => onCopy(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isCopied ? 'Copied to clipboard' : 'Copy to clipboard'
          }>
          <Text
            style={[
              styles.detailCopyText,
              isCopied && styles.detailCopyTextCopied,
            ]}>
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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

export function ClipCopyScreen({
  history,
  copiedId,
  copyToClipboard,
  clearHistory,
}: ClipCopyScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (history.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = history.some(h => h.id === selectedId);
    if (!selectedId || !stillExists) {
      setSelectedId(history[0].id);
    }
  }, [history, selectedId]);

  const selectedItem = useMemo(
    () => history.find(h => h.id === selectedId) ?? null,
    [history, selectedId],
  );

  const renderItem = useCallback(
    ({item}: {item: ClipboardItem}) => (
      <MasterRow
        item={item}
        isSelected={selectedId === item.id}
        isCopied={copiedId === item.id}
        onSelect={setSelectedId}
        onCopy={copyToClipboard}
      />
    ),
    [selectedId, copiedId, copyToClipboard],
  );

  const keyExtractor = useCallback((item: ClipboardItem) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Clipboard
        </Text>
        {history.length > 0 && (
          <TouchableOpacity
            onPress={clearHistory}
            activeOpacity={0.7}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear all clipboard history">
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

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
              data={history}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.masterList}
              ItemSeparatorComponent={Separator}
              showsVerticalScrollIndicator={false}
            />
          </View>
          <View style={styles.detailPane}>
            {selectedItem ? (
              <DetailView
                item={selectedItem}
                isCopied={copiedId === selectedItem.id}
                onCopy={copyToClipboard}
              />
            ) : (
              <DetailPlaceholder />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  clearButton: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    ...typography.caption,
    color: colors.semantic.danger,
  },

  // Split pane layout
  splitPane: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    flex: 0.35,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
  },
  detailPane: {
    flex: 0.65,
  },

  // Master list
  masterList: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + spacing.xxs,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: colors.accent.muted,
    borderLeftColor: colors.accent.primary,
  },
  rowText: {
    flex: 1,
    ...typography.body,
    color: colors.text.secondary,
  },
  rowCopyBtn: {
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rowCopyBtnCopied: {
    backgroundColor: colors.semantic.successBg,
    borderColor: colors.semantic.success,
  },
  rowCopyText: {
    ...typography.small,
    color: colors.accent.primary,
  },
  rowCopyTextCopied: {
    color: colors.semantic.success,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },

  // Detail view
  detail: {
    flex: 1,
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: spacing.xl,
  },
  detailTimestamp: {
    ...typography.caption,
    color: colors.text.placeholder,
    marginBottom: spacing.md,
  },
  detailCodeBlock: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  detailCode: {
    ...typography.code,
    color: colors.text.secondary,
  },
  detailFooter: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  detailCopyBtn: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accent.primary,
  },
  detailCopyBtnCopied: {
    backgroundColor: colors.semantic.successBg,
  },
  detailCopyText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  detailCopyTextCopied: {
    color: colors.semantic.success,
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

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.huge,
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
