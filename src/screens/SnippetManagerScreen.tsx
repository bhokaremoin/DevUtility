import React, {useCallback, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSnippets} from '../hooks';
import {Snippet} from '../types';
import {AddSnippetModal} from '../components';
import {
  colors,
  spacing,
  typography,
  radii,
  MIN_TAP_TARGET,
} from '../theme';

function SnippetCard({
  snippet,
  isCopied,
  onCopy,
  onDelete,
}: {
  snippet: Snippet;
  isCopied: boolean;
  onCopy: (s: Snippet) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {snippet.title}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, isCopied && styles.actionButtonCopied]}
            onPress={() => onCopy(snippet)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              isCopied ? 'Copied to clipboard' : `Copy snippet ${snippet.title}`
            }>
            <Text
              style={[
                styles.actionButtonText,
                isCopied && styles.actionButtonTextCopied,
              ]}>
              {isCopied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
          {confirming ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmYes}
                onPress={() => {
                  setConfirming(false);
                  onDelete(snippet.id);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete">
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setConfirming(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel delete">
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setConfirming(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Delete snippet ${snippet.title}`}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {confirming && (
        <Text style={styles.confirmLabel}>Delete this snippet?</Text>
      )}

      {snippet.description.length > 0 && (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {snippet.description}
        </Text>
      )}

      <View style={styles.codePreview}>
        <Text style={styles.codeText} numberOfLines={4}>
          {snippet.content}
        </Text>
      </View>

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
  );
}

export function SnippetManagerScreen() {
  const {
    snippets,
    searchQuery,
    setSearchQuery,
    copiedId,
    addSnippet,
    removeSnippet,
    copySnippet,
  } = useSnippets();
  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = useCallback(
    ({item}: {item: Snippet}) => (
      <SnippetCard
        snippet={item}
        isCopied={copiedId === item.id}
        onCopy={copySnippet}
        onDelete={removeSnippet}
      />
    ),
    [copiedId, copySnippet, removeSnippet],
  );

  const keyExtractor = useCallback((item: Snippet) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Snippets
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Create new snippet">
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, description, or tag…"
          placeholderTextColor={colors.text.placeholder}
          accessibilityRole="search"
          accessibilityLabel="Search snippets"
        />
      </View>

      {snippets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'</>'}</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? 'No matching snippets' : 'No snippets yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Tap "+ New" to save your first snippet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={snippets}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {modalVisible && (
        <AddSnippetModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={addSnippet}
        />
      )}
    </View>
  );
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
  addButton: {
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.accent.primary,
  },
  addButtonText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + spacing.xxs,
  },
  searchInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + spacing.xxs,
    ...typography.body,
    color: colors.text.secondary,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginTop: spacing.sm + spacing.xxs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitle: {
    flex: 1,
    ...typography.heading,
    color: colors.text.primary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
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
  actionButtonCopied: {
    backgroundColor: colors.semantic.successBg,
    borderColor: colors.semantic.success,
  },
  actionButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  actionButtonTextCopied: {
    color: colors.semantic.success,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  deleteButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.semantic.danger,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.xs + spacing.xxs,
  },
  confirmYes: {
    paddingHorizontal: spacing.md,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.semantic.dangerBg,
    borderWidth: 1,
    borderColor: colors.semantic.danger,
  },
  confirmYesText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.semantic.danger,
  },
  confirmNo: {
    paddingHorizontal: spacing.md,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  confirmNoText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  confirmLabel: {
    ...typography.caption,
    color: colors.semantic.danger,
    marginTop: spacing.xs + spacing.xxs,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs + spacing.xxs,
    lineHeight: 17,
  },
  codePreview: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xxs,
    marginTop: spacing.sm + spacing.xxs,
  },
  codeText: {
    ...typography.code,
    color: colors.text.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + spacing.xxs,
    marginTop: spacing.sm + spacing.xxs,
  },
  tag: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
  },
  tagText: {
    ...typography.small,
    color: colors.accent.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.huge,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.lg,
    color: colors.text.placeholder,
    fontWeight: '700',
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
