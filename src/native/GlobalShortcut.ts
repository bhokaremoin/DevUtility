import {NativeModules} from 'react-native';

const {GlobalShortcutModule} = NativeModules;

export interface ShortcutInfo {
  keyCode: number;
  modifiers: number;
  description: string;
}

export const GlobalShortcut = {
  getShortcut: (): Promise<ShortcutInfo | null> =>
    GlobalShortcutModule.getShortcut(),

  resetShortcut: (): void => GlobalShortcutModule.resetShortcut(),
};
