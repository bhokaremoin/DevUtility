import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
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
import {useSnippets} from '../hooks';
import {Snippet, ScreenHandle} from '../types';
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
          {draftContent.length.toLocaleString()} chars /{' '}
          {draftContent.split('\n').length.toLocaleString()} lines
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

function DetailPlaceholder() {
  return (
    <View style={styles.detailPlaceholder}>
      <Text style={styles.detailPlaceholderText}>
        Select a snippet to view its contents
      </Text>
    </View>
  );
}

export const SnippetManagerScreen = forwardRef<ScreenHandle>(
  function SnippetManagerScreen(_props, ref) {
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
  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const isDetailFocused = useRef(false);
  const visibleItemIds = useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    visibleItemIds.current = new Set(viewableItems.map((vi: any) => vi.key));
  }).current;

  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 90}).current;

  const navigate = useCallback((delta: 1 | -1) => {
    if (snippets.length === 0 || isDetailFocused.current) return;
    const idx = selectedId ? snippets.findIndex(s => s.id === selectedId) : -1;
    const newIdx = Math.max(0, Math.min(snippets.length - 1, (idx === -1 ? 0 : idx) + delta));
    const newId = snippets[newIdx].id;
    setSelectedId(newId);
    if (!visibleItemIds.current.has(newId)) {
      flatListRef.current?.scrollToIndex({
        index: newIdx,
        animated: false,
        viewPosition: delta === 1 ? 1 : 0,
      });
    }
  }, [snippets, selectedId]);

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

  useImperativeHandle(ref, () => ({
    copySelected: () => {
      if (selectedSnippet) {
        copySnippet(selectedSnippet);
      }
    },
    handleEscape: () => {
      if (searchQuery.trim()) {
        setSearchQuery('');
        return true;
      }
      if (selectedId) {
        setSelectedId(null);
        return true;
      }
      return false;
    },
    focusSearch: () => {
      searchInputRef.current?.focus();
    },
    openAddModal: () => setModalVisible(true),
    navigateUp: () => navigate(-1),
    navigateDown: () => navigate(1),
  }), [selectedSnippet, searchQuery, selectedId, copySnippet, setSearchQuery, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

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
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, description, or tag…"
          placeholderTextColor={colors.text.placeholder}
          accessibilityRole="search"
          accessibilityLabel="Search snippets"
          keyDownEvents={[{key: 'ArrowDown'}, {key: 'ArrowUp'}]}
          onKeyDown={({nativeEvent}: any) => {
            if (nativeEvent.key === 'ArrowDown') navigate(1);
            else if (nativeEvent.key === 'ArrowUp') navigate(-1);
          }}
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
              ref={flatListRef}
              data={snippets}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.masterList}
              ItemSeparatorComponent={Separator}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollToIndexFailed={({index}) => {
                flatListRef.current?.scrollToOffset({
                  offset: index * 60,
                  animated: false,
                });
              }}
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
                onEditorFocusChange={focused => { isDetailFocused.current = focused; }}
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
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + spacing.xxs,
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
