/**
 * @file hooks/useKeyboardShortcuts.ts
 * @description React hook that subscribes to keyboard events emitted by the
 * native `KeyEventModule` and dispatches them to handler callbacks.
 *
 * Architecture Role: Bridge between the native key-event layer and the JS
 * application layer. Subscribes to the `NativeEventEmitter` once on mount and
 * uses a stable ref pattern so handler callbacks can change on every render
 * (e.g. when `activeTab` changes in App.tsx) without tearing down and
 * re-creating the native subscriptions.
 */

import {useEffect, useRef} from 'react';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {Tab} from '../components/TopHeader';

const {KeyEventModule} = NativeModules;
const emitter = KeyEventModule
  ? new NativeEventEmitter(KeyEventModule)
  : null;

/** Callbacks invoked by `useKeyboardShortcuts` when native key events fire. */
interface Handlers {
  /** Called when a tab-switch shortcut fires (⌘1/⌘2/⌘3). */
  onNavigate: (tab: Tab) => void;
  /** Called when the copy shortcut fires (Enter or ⌘Enter). */
  onCopyAction: () => void;
  /** Called when Escape is pressed. */
  onEscape: () => void;
  /** Called when the search shortcut fires (⌘F). */
  onSearch: () => void;
  /** Called when an arrow key is pressed for list navigation. */
  onArrowNavigation: (direction: 'up' | 'down') => void;
}

/**
 * Subscribes to native keyboard events and dispatches them to the provided
 * handler callbacks. Subscriptions are created once on mount and cleaned up
 * on unmount; handler updates are picked up via a ref without re-subscribing.
 *
 * @param handlers - Object containing callbacks for each supported event type.
 */
export function useKeyboardShortcuts(handlers: Handlers) {
  // Keep a ref so the subscriptions (created once) always call the latest handlers
  // without needing to be torn down and re-created on every tab switch.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!emitter) {
      return;
    }

    const subs = [
      emitter.addListener('onNavigate', (body: {tab: Tab}) => {
        handlersRef.current.onNavigate(body.tab);
      }),
      emitter.addListener('onCopyAction', () => {
        handlersRef.current.onCopyAction();
      }),
      emitter.addListener('onEscape', () => {
        handlersRef.current.onEscape();
      }),
      emitter.addListener('onSearch', () => {
        handlersRef.current.onSearch();
      }),
      emitter.addListener('onArrowNavigation', (body: {direction: 'up' | 'down'}) => {
        handlersRef.current.onArrowNavigation(body.direction);
      }),
    ];

    return () => {
      subs.forEach(s => s.remove());
    };
  }, []); // Subscribe once — handlersRef always holds the latest handlers
}
