import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  ScrollView,
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

function SnippetRow({
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

function SnippetDetailView({
  snippet,
  isCopied,
  onCopy,
  onDelete,
  onUpdate,
}: {
  snippet: Snippet;
  isCopied: boolean;
  onCopy: (s: Snippet, contentOverride?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
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
      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator>
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

        <TextInput
          style={styles.detailCodeInput}
          value={draftContent}
          onChangeText={setDraftContent}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          placeholderTextColor={colors.text.placeholder}
        />
      </ScrollView>

      <View style={styles.detailFooter}>
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

function DetailPlaceholder() {
  return (
    <View style={styles.detailPlaceholder}>
      <Text style={styles.detailPlaceholderText}>
        Select a snippet to view its contents
      </Text>
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
    updateSnippetContent,
  } = useSnippets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (snippets.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = snippets.some(s => s.id === selectedId);
    if (!selectedId || !stillExists) {
      setSelectedId(snippets[0].id);
    }
  }, [snippets, selectedId]);

  const selectedSnippet = useMemo(
    () => snippets.find(s => s.id === selectedId) ?? null,
    [snippets, selectedId],
  );

  const renderItem = useCallback(
    ({item}: {item: Snippet}) => (
      <SnippetRow
        snippet={item}
        isSelected={selectedId === item.id}
        isCopied={copiedId === item.id}
        onSelect={setSelectedId}
        onCopy={copySnippet}
      />
    ),
    [selectedId, copiedId, copySnippet],
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
        <View style={styles.splitPane}>
          <View style={styles.masterPane}>
            <FlatList
              data={snippets}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.masterList}
              ItemSeparatorComponent={Separator}
              showsVerticalScrollIndicator={false}
            />
          </View>
          <View style={styles.detailPane}>
            {selectedSnippet ? (
              <SnippetDetailView
                snippet={selectedSnippet}
                isCopied={copiedId === selectedSnippet.id}
                onCopy={copySnippet}
                onDelete={removeSnippet}
                onUpdate={updateSnippetContent}
              />
            ) : (
              <DetailPlaceholder />
            )}
          </View>
        </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
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
    color: colors.accent.primary,
  },
  detailCodeInput: {
    ...typography.code,
    color: colors.text.secondary,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.xs,
    minHeight: 200,
  },
  detailFooter: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
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
