import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Snippet} from '../types';
import {colors, spacing, typography, radii} from '../theme';

export function SnippetRow({
  snippet,
  isSelected,
  isCopied,
  onSelect,
  onCopy,
}: {
  snippet: Snippet;
  isSelected: boolean;
  isCopied: boolean;
  onSelect: (id: string) => void;
  onCopy: (s: Snippet) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={() => onSelect(snippet.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{selected: isSelected}}
      accessibilityLabel={`Snippet: ${snippet.title}`}>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {snippet.title}
        </Text>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {snippet.content}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.rowCopyBtn, isCopied && styles.rowCopyBtnCopied]}
        onPress={() => onCopy(snippet)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          isCopied ? 'Copied to clipboard' : `Copy snippet ${snippet.title}`
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
  rowContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  rowPreview: {
    ...typography.code,
    color: colors.text.placeholder,
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
