import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ClipboardItem, ScreenHandle} from '../types';
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
  copyToClipboard: (item: ClipboardItem, textOverride?: string) => void;
  updateItemText: (id: string, text: string) => void;
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
  onUpdate,
}: {
  item: ClipboardItem;
  isCopied: boolean;
  onCopy: (item: ClipboardItem, textOverride?: string) => void;
  onUpdate: (id: string, text: string) => void;
}) {
  const [draftContent, setDraftContent] = useState(item.text);

  useEffect(() => {
    setDraftContent(item.text);
  }, [item.id, item.text]);

  const hasEdits = draftContent !== item.text;

  const formattedTime = useMemo(
    () => new Date(item.timestamp).toLocaleString(),
    [item.timestamp],
  );

  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTimestamp}>{formattedTime}</Text>
      </View>
      <TextInput
        style={styles.detailCodeInput}
        value={draftContent}
        onChangeText={setDraftContent}
        multiline
        textAlignVertical="top"
        scrollEnabled
        placeholderTextColor={colors.text.placeholder}
      />
      <View style={styles.detailFooter}>
        <Text style={styles.contentStats}>
          {draftContent.length.toLocaleString()} chars /{' '}
          {draftContent.split('\n').length.toLocaleString()} lines
        </Text>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[
              styles.detailCopyBtn,
              isCopied && styles.detailCopyBtnCopied,
            ]}
            onPress={() => onCopy(item, draftContent)}
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
          {hasEdits && (
            <TouchableOpacity
              style={styles.detailSaveBtn}
              onPress={() => onUpdate(item.id, draftContent)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Save edits">
              <Text style={styles.detailSaveText}>Save Edits</Text>
            </TouchableOpacity>
          )}
        </View>
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

export const ClipCopyScreen = forwardRef<ScreenHandle, ClipCopyScreenProps>(
  function ClipCopyScreen(
    {history, copiedId, copyToClipboard, updateItemText},
    ref,
  ) {
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

  useImperativeHandle(ref, () => ({
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
  }), [selectedItem, selectedId, copyToClipboard]);

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
                onUpdate={updateItemText}
              />
            ) : (
              <DetailPlaceholder />
            )}
          </View>
        </View>
      )}
    </View>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
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
    borderLeftColor: colors.text.primary,
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
    color: colors.text.secondary,
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
  detailHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  detailTimestamp: {
    ...typography.caption,
    color: colors.text.placeholder,
  },
  detailCodeInput: {
    flex: 1,
    ...typography.code,
    color: colors.text.secondary,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    minHeight: 120,
  },
  detailFooter: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  contentStats: {
    ...typography.caption,
    color: colors.text.placeholder,
    marginBottom: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm + spacing.xxs,
  },
  detailCopyBtn: {
    flex: 1,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
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
  detailSaveBtn: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.semantic.success,
  },
  detailSaveText: {
    ...typography.bodyBold,
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
