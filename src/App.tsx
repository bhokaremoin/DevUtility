import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ClipCopyScreen, SnippetManagerScreen} from './screens';

type Tab = 'clipboard' | 'snippets';

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('clipboard');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clipboard' && styles.tabActive]}
          onPress={() => setActiveTab('clipboard')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'clipboard' && styles.tabTextActive,
            ]}>
            Clipboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'snippets' && styles.tabActive]}
          onPress={() => setActiveTab('snippets')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'snippets' && styles.tabTextActive,
            ]}>
            Snippets
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'clipboard' ? (
        <ClipCopyScreen />
      ) : (
        <SnippetManagerScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#14142a',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a4a',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1a1a2e',
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: '#2a2a4a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a5a7a',
  },
  tabTextActive: {
    color: '#8a8aff',
  },
});

export default App;
