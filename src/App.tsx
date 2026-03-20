/**
 * @file App.tsx
 * @description Root application component for DevUtility.
 *
 * Architecture Role: Top-level coordinator that wires together screens, the
 * shared clipboard state, and the global keyboard shortcut dispatcher.
 *
 * Responsibilities:
 * - Renders `TopHeader` and the active screen (ClipCopy / Snippets / Settings).
 * - Holds `clipboardState` from `useClipboardHistory` and passes it down to
 *   `ClipCopyScreen` via spread props.
 * - Maintains `clipboardRef` and `snippetRef` as `ScreenHandle` refs so
 *   keyboard events can call screen-level actions imperatively.
 * - Passes a `handlers` object to `useKeyboardShortcuts` — a stable object
 *   (via `useMemo`) that reads `getActiveRef()` at call time, so screen refs
 *   are always fresh without re-subscribing to native events on every render.
 */

import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, Keyboard, NativeModules, StyleSheet, View} from 'react-native';
import {ClipCopyScreen, SnippetManagerScreen, SettingsScreen} from './screens';
import {TopHeader, ShortcutsModal, Tab} from './components';
import {useClipboardHistory, useKeyboardShortcuts} from './hooks';
import {ScreenHandle} from './types';
import {colors} from './theme';

const {KeyEventModule} = NativeModules;

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('clipboard');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const clipboardState = useClipboardHistory();
  const clipboardRef = useRef<ScreenHandle>(null);
  const snippetRef = useRef<ScreenHandle>(null);

  const getActiveRef = useCallback(() => {
    if (activeTab === 'clipboard') return clipboardRef;
    if (activeTab === 'snippets') return snippetRef;
    return null;
  }, [activeTab]);

  // Keyboard event handlers passed to useKeyboardShortcuts. Wrapped in useMemo
  // so the object reference is stable across renders — the native subscriptions
  // are created once and always call the latest handler via getActiveRef().
  const handlers = useMemo(
    () => ({
      onNavigate: (tab: Tab) => setActiveTab(tab),
      onCopyAction: () => getActiveRef()?.current?.copySelected?.(),
      onEscape: () => {
        // Give the active screen a chance to handle Escape first (e.g. clear
        // selection or search query); fall through to hide the panel if not consumed.
        const handled = getActiveRef()?.current?.handleEscape?.();
        if (!handled) {
          KeyEventModule?.hidePanel?.();
        }
      },
      onSearch: () => {
        // ⌘F always switches to Snippets and focuses search, even from other tabs.
        if (activeTab !== 'snippets') {
          setActiveTab('snippets');
        }
        setTimeout(() => snippetRef.current?.focusSearch?.(), 50);
      },
      onArrowNavigation: (direction: 'up' | 'down') => {
        const ref = getActiveRef();
        if (direction === 'down') ref?.current?.navigateDown?.();
        else ref?.current?.navigateUp?.();
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
          onHelpPress={() => {
            Keyboard.dismiss();
            snippetRef.current?.blurAll?.();
            setShowShortcuts(true);
          }}
        />
        <ShortcutsModal
          visible={showShortcuts}
          onClose={() => setShowShortcuts(false)}
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
