import {useEffect} from 'react';
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
}

export function useKeyboardShortcuts(handlers: Handlers) {
  useEffect(() => {
    if (!emitter) {
      return;
    }

    const subs = [
      emitter.addListener('onNavigate', (body: {tab: Tab}) => {
        handlers.onNavigate(body.tab);
      }),
      emitter.addListener('onCopyAction', () => {
        handlers.onCopyAction();
      }),
      emitter.addListener('onEscape', () => {
        handlers.onEscape();
      }),
      emitter.addListener('onSearch', () => {
        handlers.onSearch();
      }),
    ];

    return () => {
      subs.forEach(s => s.remove());
    };
  }, [handlers]);
}
