import React, {useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useClipboardHistory} from '../hooks';
import {ClipboardItem} from '../types';

const MAX_DISPLAY_LENGTH = 120;

function ClipCopyItem({
  item,
  isCopied,
  onCopy,
}: {
  item: ClipboardItem;
  isCopied: boolean;
  onCopy: (item: ClipboardItem) => void;
}) {
  const displayText =
    item.text.length > MAX_DISPLAY_LENGTH
      ? item.text.slice(0, MAX_DISPLAY_LENGTH) + '…'
      : item.text;

  return (
    <View style={styles.row}>
      <Text style={styles.itemText} numberOfLines={2}>
        {displayText}
      </Text>
      <TouchableOpacity
        style={[styles.copyButton, isCopied && styles.copyButtonCopied]}
        onPress={() => onCopy(item)}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.copyButtonText,
            isCopied && styles.copyButtonTextCopied,
          ]}>
          {isCopied ? 'Copied!' : 'Copy'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ClipCopyScreen() {
  const {history, copiedId, copyToClipboard, clearHistory} =
    useClipboardHistory();

  const renderItem = useCallback(
    ({item}: {item: ClipboardItem}) => (
      <ClipCopyItem
        item={item}
        isCopied={copiedId === item.id}
        onCopy={copyToClipboard}
      />
    ),
    [copiedId, copyToClipboard],
  );

  const keyExtractor = useCallback((item: ClipboardItem) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clip Copy</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No clipboard history yet</Text>
          <Text style={styles.emptySubtitle}>
            Copy something and it will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
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
  clearText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: '#c8c8e0',
    lineHeight: 18,
  },
  copyButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a4a',
    marginHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
