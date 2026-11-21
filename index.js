import {AppRegistry} from 'react-native';
import {ClipboardTool} from './src/tools/clipboard/ClipboardTool';
import {SnippetsTool} from './src/tools/snippets/SnippetsTool';
import {SettingsWindow} from './src/settings/SettingsWindow';

// Each name matches a tool's moduleName in the native ToolRegistry (Settings is its own window).
AppRegistry.registerComponent('ClipboardTool', () => ClipboardTool);
AppRegistry.registerComponent('SnippetsTool', () => SnippetsTool);
AppRegistry.registerComponent('Settings', () => SettingsWindow);
