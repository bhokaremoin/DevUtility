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
            style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
            onPress={() => onCopy(snippet)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.copyButtonText,
                isCopied && styles.copyButtonTextCopied,
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
                activeOpacity={0.7}>
                <Text style={styles.confirmYesText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmNo}
                onPress={() => setConfirming(false)}
                activeOpacity={0.7}>
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setConfirming(true)}
              activeOpacity={0.7}>
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
        <Text style={styles.title}>Snippets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, description, or tag…"
          placeholderTextColor="#5a5a7a"
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e0e0f0',
    letterSpacing: 0.3,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4a4aff',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#14142a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#e0e0f0',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1e1e3a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    padding: 16,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#e0e0f0',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  copyButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
    minWidth: 72,
    alignItems: 'center',
  },
  copyButtonCopied: {
    backgroundColor: '#1a3a2a',
    borderColor: '#2ecc71',
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8aff',
  },
  copyButtonTextCopied: {
    color: '#2ecc71',
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 6,
  },
  confirmYes: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  confirmNo: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
    alignItems: 'center',
  },
  confirmNoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8aaa',
  },
  confirmLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ff6b6b',
    marginTop: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#8a8aaa',
    marginTop: 6,
    lineHeight: 17,
  },
  codePreview: {
    backgroundColor: '#14142a',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'Menlo',
    color: '#a0a0d0',
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#2a2a4a',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8a8aff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
    color: '#5a5a7a',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a8aaa',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5a5a7a',
  },
});
