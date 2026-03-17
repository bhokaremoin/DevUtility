import React, {useCallback} from 'react';
import {
  FlatList,
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

function ClipCopyItem({
  item,
  isCopied,
  onCopy,
}: {
  item: ClipboardItem;
  isCopied: boolean;
  onCopy: (item: ClipboardItem) => void;
}) {
  const displayText =
    item.text.length > MAX_DISPLAY_LENGTH
      ? item.text.slice(0, MAX_DISPLAY_LENGTH) + '…'
      : item.text;

  return (
    <View style={styles.row}>
      <Text style={styles.itemText} numberOfLines={2}>
        {displayText}
      </Text>
      <TouchableOpacity
        style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
        onPress={() => onCopy(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}>
        <Text
          style={[
            styles.copyButtonText,
            isCopied && styles.copyButtonTextCopied,
          ]}>
          {isCopied ? 'Copied!' : 'Copy'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ClipCopyScreen({
  history,
  copiedId,
  copyToClipboard,
  clearHistory,
}: ClipCopyScreenProps) {

  const renderItem = useCallback(
    ({item}: {item: ClipboardItem}) => (
      <ClipCopyItem
        item={item}
        isCopied={copiedId === item.id}
        onCopy={copyToClipboard}
      />
    ),
    [copiedId, copyToClipboard],
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
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
        />
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
  list: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.text.secondary,
  },
  copyButton: {
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    minWidth: 72,
  },
  copyButtonCopied: {
    backgroundColor: colors.semantic.successBg,
    borderColor: colors.semantic.success,
  },
  copyButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  copyButtonTextCopied: {
    color: colors.semantic.success,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },
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
