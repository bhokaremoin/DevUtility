import {NativeModules} from 'react-native';
import {ToolId} from '../toolIds';

const {ToolPanelModule} = NativeModules;

export const ToolPanel = {
  hide: (toolId: ToolId): void => ToolPanelModule.hide(toolId),
};
