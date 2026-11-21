import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSnippets} from './useSnippets';
import {useListNavigation} from '../../shared/useListNavigation';
import {Snippet, ScreenHandle} from '../../shared/types';
import {AddSnippetModal} from './AddSnippetModal';
import {SnippetRow} from './SnippetRow';
import {SnippetDetailView} from './SnippetDetailView';
import {colors, spacing, typography, radii} from '../../shared/theme';

export const SnippetsScreen = forwardRef<ScreenHandle>(
  function SnippetsScreen(_props, ref) {
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
    const searchInputRef = useRef<TextInput>(null);
    const isSearchFocused = useRef(false);
    const {
      selectedId,
      setSelectedId,
      selectedItem: selectedSnippet,
      flatListRef,
      isDetailFocused,
      navigate,
      onViewableItemsChanged,
      viewabilityConfig,
    } = useListNavigation(snippets);

    useImperativeHandle(
      ref,
      () => ({
        copySelected: () => {
          if (selectedSnippet) {
            copySnippet(selectedSnippet);
          }
        },
        isTextInputFocused: () => isSearchFocused.current || isDetailFocused.current,
        searchText: () => searchQuery,
        isAddDialogOpen: () => modalVisible,
        closeAddDialog: () => setModalVisible(false),
        clearSearch: () => setSearchQuery(''),
        focusSearch: () => {
          searchInputRef.current?.focus();
        },
        blurAll: () => {
          searchInputRef.current?.blur();
        },
        openAddModal: () => setModalVisible(true),
        navigateUp: () => navigate(-1),
        navigateDown: () => navigate(1),
      }),
      [
        selectedSnippet,
        searchQuery,
        modalVisible,
        copySnippet,
        setSearchQuery,
        navigate,
        isDetailFocused,
      ],
    );

    useEffect(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }, []);

    const renderItem = useCallback(
      ({item, index}: {item: Snippet; index: number}) => (
        <SnippetRow
          snippet={item}
          testIDPrefix={`snippets.row.${index}`}
          isSelected={selectedId === item.id}
          isCopied={copiedId === item.id}
          onSelect={setSelectedId}
          onCopy={copySnippet}
        />
      ),
      [selectedId, setSelectedId, copiedId, copySnippet],
    );

    const keyExtractor = useCallback((item: Snippet) => item.id, []);

    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            testID="snippets.search"
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              isSearchFocused.current = true;
            }}
            onBlur={() => {
              isSearchFocused.current = false;
            }}
            placeholder="Search by title, description, or tag…"
            placeholderTextColor={colors.text.placeholder}
            accessibilityRole="search"
            accessibilityLabel="Search snippets"
            keyDownEvents={[{key: 'ArrowDown'}, {key: 'ArrowUp'}]}
            onKeyDown={({nativeEvent}: any) => {
              if (nativeEvent.key === 'ArrowDown') {
                navigate(1);
              } else if (nativeEvent.key === 'ArrowUp') {
                navigate(-1);
              }
            }}
          />
        </View>

        {snippets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'</>'}</Text>
            <Text
              testID="snippets.emptyState.title"
              accessible
              style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No matching snippets' : 'No snippets yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Try a different search term'
                : 'Click "+ Add" to save your first snippet'}
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
                  onEditorFocusChange={focused => {
                    isDetailFocused.current = focused;
                  }}
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
  },
);

function Separator() {
  return <View style={styles.separator} />;
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
    borderBottomColor: colors.border.default,
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
  splitPane: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    flex: 0.35,
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  detailPane: {
    flex: 0.65,
  },
  masterList: {
    paddingVertical: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
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
