/**
 * @file screens/SnippetManagerScreen.tsx
 * @description Master-detail screen for browsing, searching, and managing
 * saved code snippets.
 *
 * Architecture Role: One of three top-level screens rendered by `App.tsx`.
 * Owns the search bar, two-pane list/detail layout, and the "Add Snippet" modal.
 * Exposes a full `ScreenHandle` via `forwardRef` so `App.tsx`'s keyboard
 * dispatcher can trigger search focus, selection clear, add-modal, and navigation.
 *
 * All data operations are delegated to `useSnippets`; layout navigation is
 * handled by `useListNavigation`.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {FlatList, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSnippets, useListNavigation} from '../hooks';
import {Snippet, ScreenHandle} from '../types';
import {AddSnippetModal, SnippetRow, SnippetDetailView} from '../components';
import {colors, spacing, typography, radii} from '../theme';

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
    const searchInputRef = useRef<TextInput>(null);
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
        selectedId,
        setSelectedId,
        copySnippet,
        setSearchQuery,
        navigate,
      ],
    );

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
      [selectedId, setSelectedId, copiedId, copySnippet],
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
