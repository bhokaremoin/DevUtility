import {useEffect, useRef} from 'react';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {ToolId} from './toolIds';

const {KeyEventModule} = NativeModules;
const emitter = KeyEventModule ? new NativeEventEmitter(KeyEventModule) : null;

interface Handlers {
  /** Return outside a text input, or ⌘Return anywhere. */
  onCopyAction: () => void;
  onEscape: (isTextInputFocused: boolean) => void;
  /** ⌘F */
  onSearch?: () => void;
  onArrowNavigation: (direction: 'up' | 'down') => void;
  /** The tool's panel has just opened. */
  onPanelShown?: () => void;
}

interface ToolKeyEvent {
  toolId: ToolId;
}

/**
 * Calls the handlers for key presses in this tool's panel. Every tool's root listens to the same
 * native events, each tagged with the tool whose panel was in front, so events for other tools are
 * ignored.
 */
export function useKeyboardShortcuts(toolId: ToolId, handlers: Handlers) {
  // The subscriptions are made once; the ref lets them call the latest handlers.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!emitter) {
      return;
    }
    const isForThisTool = (event: ToolKeyEvent) => event.toolId === toolId;

    const subscriptions = [
      emitter.addListener('onCopyAction', (event: ToolKeyEvent) => {
        if (isForThisTool(event)) {
          handlersRef.current.onCopyAction();
        }
      }),
      emitter.addListener('onEscape', (event: ToolKeyEvent & {isTextInputFocused: boolean}) => {
        if (isForThisTool(event)) {
          handlersRef.current.onEscape(event.isTextInputFocused);
        }
      }),
      emitter.addListener('onSearch', (event: ToolKeyEvent) => {
        if (isForThisTool(event)) {
          handlersRef.current.onSearch?.();
        }
      }),
      emitter.addListener('onPanelShown', (event: ToolKeyEvent) => {
        if (isForThisTool(event)) {
          handlersRef.current.onPanelShown?.();
        }
      }),
      emitter.addListener('onArrowNavigation', (event: ToolKeyEvent & {direction: 'up' | 'down'}) => {
        if (isForThisTool(event)) {
          handlersRef.current.onArrowNavigation(event.direction);
        }
      }),
    ];

    return () => subscriptions.forEach(subscription => subscription.remove());
  }, [toolId]);
}
