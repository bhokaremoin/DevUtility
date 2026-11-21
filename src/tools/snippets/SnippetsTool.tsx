import React, {useMemo, useRef, useState} from 'react';
import {Keyboard, StyleSheet, View} from 'react-native';
import {SnippetsScreen} from './SnippetsScreen';
import {HeaderButton, ToolHeader} from '../../shared/ToolHeader';
import {ShortcutsModal} from '../../shared/ShortcutsModal';
import {StorageResetGate} from '../../shared/StorageResetGate';
import {useKeyboardShortcuts} from '../../shared/useKeyboardShortcuts';
import {ToolPanel} from '../../shared/native/ToolPanel';
import {ScreenHandle} from '../../shared/types';
import {colors} from '../../shared/theme';

interface SnippetsToolProps {
  isE2EReset?: boolean;
}

export function SnippetsTool({isE2EReset = false}: SnippetsToolProps): React.JSX.Element {
  return (
    <StorageResetGate shouldReset={isE2EReset}>
      <Snippets />
    </StorageResetGate>
  );
}

function Snippets(): React.JSX.Element {
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const screenRef = useRef<ScreenHandle>(null);

  const keyHandlers = useMemo(
    () => ({
      onCopyAction: () => screenRef.current?.copySelected?.(),
      onEscape: () => {
        const isHandledByScreen = screenRef.current?.handleEscape?.();
        if (!isHandledByScreen) {
          ToolPanel.hide('snippets');
        }
      },
      onSearch: () => screenRef.current?.focusSearch?.(),
      onArrowNavigation: (direction: 'up' | 'down') => {
        if (direction === 'down') {
          screenRef.current?.navigateDown?.();
        } else {
          screenRef.current?.navigateUp?.();
        }
      },
    }),
    [],
  );
  useKeyboardShortcuts('snippets', keyHandlers);

  const openShortcutsHelp = () => {
    Keyboard.dismiss();
    screenRef.current?.blurAll?.();
    setIsShortcutsHelpOpen(true);
  };

  return (
    <View style={styles.root}>
      <ToolHeader title="Snippets">
        <HeaderButton
          testID="snippets.header.add"
          label="+ Add"
          accessibilityLabel="Create new snippet"
          tone="accent"
          onPress={() => screenRef.current?.openAddModal?.()}
        />
        <HeaderButton
          testID="snippets.header.help"
          label="?"
          accessibilityLabel="Keyboard shortcuts"
          tone="quiet"
          onPress={openShortcutsHelp}
        />
        <HeaderButton
          testID="snippets.header.close"
          label="✕"
          accessibilityLabel="Close Snippets"
          tone="quiet"
          onPress={() => ToolPanel.hide('snippets')}
        />
      </ToolHeader>
      <ShortcutsModal visible={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} />
      <View style={styles.content}>
        <SnippetsScreen ref={screenRef} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
});
