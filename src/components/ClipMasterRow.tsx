import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {ClipboardItem} from '../types';
import {colors, spacing, typography, radii} from '../theme';
import {MAX_DISPLAY_LENGTH} from '../constants';
import {truncateText} from '../utils';

export function ClipMasterRow({
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
  const displayText = truncateText(item.text, MAX_DISPLAY_LENGTH);

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
          style={[styles.rowCopyText, isCopied && styles.rowCopyTextCopied]}>
          {isCopied ? '✓' : 'Copy'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
