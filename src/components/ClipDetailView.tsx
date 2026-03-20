/**
 * @file components/ClipDetailView.tsx
 * @description Detail pane for a selected clipboard item, featuring an editable
 * code editor and copy/save action buttons.
 *
 * Architecture Role: Right-hand panel of the `ClipCopyScreen` master-detail
 * layout. Manages a local `draftContent` state so edits don't immediately
 * mutate the stored item — the user must press "Save Edits" explicitly.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ClipboardItem} from '../types';
import {colors, spacing, typography, radii, MIN_TAP_TARGET} from '../theme';
import {formatContentStats} from '../utils';

/**
 * Full-detail view for a clipboard item with an editable text area.
 *
 * @param item - The clipboard entry to display and optionally edit.
 * @param isCopied - Whether this item is showing the "Copied!" feedback state.
 * @param onCopy - Called to copy the item; receives the item plus an optional
 *   draft override so in-progress edits can be copied before saving.
 * @param onUpdate - Called to persist edited text back to the history store.
 * @param onEditorFocusChange - Called with `true`/`false` when the text editor
 *   gains or loses focus; used by the parent to suppress list navigation.
 */
export function ClipDetailView({
  item,
  isCopied,
  onCopy,
  onUpdate,
  onEditorFocusChange,
}: {
  item: ClipboardItem;
  isCopied: boolean;
  onCopy: (item: ClipboardItem, textOverride?: string) => void;
  onUpdate: (id: string, text: string) => void;
  onEditorFocusChange: (focused: boolean) => void;
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
        <View style={styles.timestampChip}>
          <Text style={styles.detailTimestamp}>{formattedTime}</Text>
        </View>
      </View>
      <TextInput
        style={styles.detailCodeInput}
        value={draftContent}
        onChangeText={setDraftContent}
        multiline
        textAlignVertical="top"
        scrollEnabled
        placeholderTextColor={colors.text.placeholder}
        onFocus={() => onEditorFocusChange(true)}
        onBlur={() => onEditorFocusChange(false)}
      />
      <View style={styles.detailFooter}>
        <Text style={styles.contentStats}>
          {formatContentStats(draftContent)}
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

const styles = StyleSheet.create({
  detail: {
    flex: 1,
  },
  detailHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  timestampChip: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignSelf: 'flex-start',
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
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
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
    backgroundColor: colors.accent.deep,
    borderWidth: 0,
  },
  detailCopyBtnCopied: {
    backgroundColor: colors.semantic.success,
  },
  detailCopyText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  detailCopyTextCopied: {
    color: '#FFFFFF',
  },
  detailSaveBtn: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.semantic.successBg,
    borderWidth: 1,
    borderColor: colors.semantic.success,
  },
  detailSaveText: {
    ...typography.bodyBold,
    color: colors.semantic.success,
  },
});
