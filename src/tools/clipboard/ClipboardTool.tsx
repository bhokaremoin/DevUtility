import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {ClipboardScreen} from './ClipboardScreen';
import {useClipboardHistory} from './useClipboardHistory';
import {clipboardEscapeAction} from './clipboardEscape';
import {CLIPBOARD_SHORTCUT_SECTIONS} from './clipboardShortcuts';
import {HeaderButton, ToolHeader} from '../../shared/ToolHeader';
import {ShortcutsModal} from '../../shared/ShortcutsModal';
import {StorageResetGate} from '../../shared/StorageResetGate';
import {useKeyboardShortcuts} from '../../shared/useKeyboardShortcuts';
import {ToolPanel} from '../../shared/native/ToolPanel';
import {ScreenHandle} from '../../shared/types';
import {colors} from '../../shared/theme';

interface ClipboardToolProps {
  isE2EReset?: boolean;
}

export function ClipboardTool({isE2EReset = false}: ClipboardToolProps): React.JSX.Element {
  return (
    <StorageResetGate shouldReset={isE2EReset}>
      <Clipboard />
    </StorageResetGate>
  );
}

function Clipboard(): React.JSX.Element {
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const clipboardState = useClipboardHistory();
  const screenRef = useRef<ScreenHandle>(null);

  const keyHandlers = useMemo(
    () => ({
      onCopyAction: () => screenRef.current?.copySelected?.(),
      onEscape: (isTextInputFocused: boolean) => {
        const action = clipboardEscapeAction({isSheetOpen: isShortcutsHelpOpen, isEditorFocused: isTextInputFocused});
        if (action === 'closeSheet') {
          setIsShortcutsHelpOpen(false);
        } else if (action === 'blurEditor') {
          ToolPanel.endEditing('clipboard');
        } else {
          ToolPanel.hide('clipboard');
        }
      },
      onArrowNavigation: (direction: 'up' | 'down') => {
        if (direction === 'down') {
          screenRef.current?.navigateDown?.();
        } else {
          screenRef.current?.navigateUp?.();
        }
      },
    }),
    [isShortcutsHelpOpen],
  );
  useKeyboardShortcuts('clipboard', keyHandlers);

  const confirmClearAll = useCallback(() => {
    Alert.alert('Clear all?', 'This will remove all items from your clipboard history.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear All', style: 'destructive', onPress: clipboardState.clearHistory},
    ]);
  }, [clipboardState.clearHistory]);

  return (
    <View style={styles.root}>
      <ToolHeader title="Clipboard">
        {clipboardState.history.length > 0 && (
          <HeaderButton
            testID="clipboard.header.clearAll"
            label="Clear All"
            accessibilityLabel="Clear all clipboard history"
            tone="danger"
            onPress={confirmClearAll}
          />
        )}
        <HeaderButton
          testID="clipboard.header.help"
          label="?"
          accessibilityLabel="Keyboard shortcuts"
          tone="quiet"
          onPress={() => setIsShortcutsHelpOpen(true)}
        />
      </ToolHeader>
      <ShortcutsModal
        visible={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        sections={CLIPBOARD_SHORTCUT_SECTIONS}
      />
      <View style={styles.content}>
        <ClipboardScreen ref={screenRef} {...clipboardState} />
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
