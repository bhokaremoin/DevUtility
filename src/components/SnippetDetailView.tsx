import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Snippet} from '../types';
import {colors, spacing, typography, radii, MIN_TAP_TARGET} from '../theme';
import {formatContentStats} from '../utils';

export function SnippetDetailView({
  snippet,
  isCopied,
  onCopy,
  onDelete,
  onUpdate,
  onEditorFocusChange,
}: {
  snippet: Snippet;
  isCopied: boolean;
  onCopy: (s: Snippet, contentOverride?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onEditorFocusChange: (focused: boolean) => void;
}) {
  const [draftContent, setDraftContent] = useState(snippet.content);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setDraftContent(snippet.content);
    setConfirming(false);
  }, [snippet.id, snippet.content]);

  const hasEdits = draftContent !== snippet.content;

  return (
    <View style={styles.detail}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailTitle}>{snippet.title}</Text>

        {snippet.description.length > 0 && (
          <Text style={styles.detailDesc}>{snippet.description}</Text>
        )}

        {snippet.tags.length > 0 && (
          <View style={styles.tagRow}>
            {snippet.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
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
        {confirming ? (
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmLabel}>Delete this snippet?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setConfirming(false);
                  onDelete(snippet.id);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete">
                <Text style={styles.confirmYesText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setConfirming(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel delete">
                <Text style={styles.confirmNoText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[
                styles.detailCopyBtn,
                isCopied && styles.detailCopyBtnCopied,
              ]}
              onPress={() => onCopy(snippet, draftContent)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                isCopied ? 'Copied to clipboard' : 'Copy snippet'
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
                onPress={() => onUpdate(snippet.id, draftContent)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Save edits">
                <Text style={styles.detailSaveText}>Save Edits</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.detailDeleteBtn}
              onPress={() => setConfirming(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Delete snippet ${snippet.title}`}>
              <Text style={styles.detailDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
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
  detailTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  detailDesc: {
    ...typography.body,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + spacing.xxs,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
  },
  tagText: {
    ...typography.small,
    color: colors.text.secondary,
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
  detailDeleteBtn: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  detailDeleteText: {
    ...typography.bodyBold,
    color: colors.semantic.danger,
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
  confirmContainer: {
    gap: spacing.sm,
  },
  confirmLabel: {
    ...typography.caption,
    color: colors.semantic.danger,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm + spacing.xxs,
  },
  confirmYes: {
    flex: 1,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.semantic.dangerBg,
    borderWidth: 1,
    borderColor: colors.semantic.danger,
  },
  confirmYesText: {
    ...typography.bodyBold,
    color: colors.semantic.danger,
  },
  confirmNo: {
    flex: 1,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  confirmNoText: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
  },
});
