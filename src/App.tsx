import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, NativeModules, StyleSheet, View} from 'react-native';
import {ClipCopyScreen, SnippetManagerScreen, SettingsScreen} from './screens';
import {TopHeader, Tab} from './components';
import {useClipboardHistory, useKeyboardShortcuts} from './hooks';
import {ScreenHandle} from './types';
import {colors} from './theme';

const {KeyEventModule} = NativeModules;

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('clipboard');
  const clipboardState = useClipboardHistory();
  const clipboardRef = useRef<ScreenHandle>(null);
  const snippetRef = useRef<ScreenHandle>(null);

  const getActiveRef = useCallback(() => {
    if (activeTab === 'clipboard') return clipboardRef;
    if (activeTab === 'snippets') return snippetRef;
    return null;
  }, [activeTab]);

  const handlers = useMemo(
    () => ({
      onNavigate: (tab: Tab) => setActiveTab(tab),
      onCopyAction: () => getActiveRef()?.current?.copySelected?.(),
      onEscape: () => {
        const handled = getActiveRef()?.current?.handleEscape?.();
        if (!handled) {
          KeyEventModule?.hidePanel?.();
        }
      },
      onSearch: () => {
        if (activeTab !== 'snippets') {
          setActiveTab('snippets');
        }
        setTimeout(() => snippetRef.current?.focusSearch?.(), 50);
      },
    }),
    [activeTab, getActiveRef],
  );

  useKeyboardShortcuts(handlers);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear all?',
      'This will remove all items from your clipboard history.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Clear All', style: 'destructive', onPress: clipboardState.clearHistory},
      ],
    );
  }, [clipboardState.clearHistory]);

  return (
    <View style={styles.root}>
      <View style={styles.layout}>
        <TopHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClearAll={handleClearAll}
          showClearAll={activeTab === 'clipboard' && clipboardState.history.length > 0}
          onAddSnippet={() => snippetRef.current?.openAddModal?.()}
        />
        <View style={styles.content}>
          {activeTab === 'clipboard' && (
            <ClipCopyScreen ref={clipboardRef} {...clipboardState} />
          )}
          {activeTab === 'snippets' && (
            <SnippetManagerScreen ref={snippetRef} />
          )}
          {activeTab === 'settings' && <SettingsScreen />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  layout: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
});

export default App;
