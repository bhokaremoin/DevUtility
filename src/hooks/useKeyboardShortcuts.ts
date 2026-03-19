import {useEffect, useRef} from 'react';
import {NativeModules, NativeEventEmitter} from 'react-native';
import {Tab} from '../components/TopHeader';

const {KeyEventModule} = NativeModules;
const emitter = KeyEventModule
  ? new NativeEventEmitter(KeyEventModule)
  : null;

interface Handlers {
  onNavigate: (tab: Tab) => void;
  onCopyAction: () => void;
  onEscape: () => void;
  onSearch: () => void;
  onArrowNavigation: (direction: 'up' | 'down') => void;
}

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
