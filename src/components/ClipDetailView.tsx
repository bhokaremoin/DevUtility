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
});
