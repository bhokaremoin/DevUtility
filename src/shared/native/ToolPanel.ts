import {NativeModules} from 'react-native';
import {ToolId} from '../toolIds';

const {ToolPanelModule} = NativeModules;

export const ToolPanel = {
  hide: (toolId: ToolId): void => ToolPanelModule.hide(toolId),
  /** Takes keyboard focus off the text input that has it in the tool's panel. */
  endEditing: (toolId: ToolId): void => ToolPanelModule.endEditing(toolId),
};
