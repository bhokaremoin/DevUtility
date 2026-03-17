import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {ClipCopyScreen, SnippetManagerScreen, SettingsScreen} from './screens';
import {Sidebar, Tab} from './components';
import {useClipboardHistory} from './hooks';
import {colors} from './theme';

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('clipboard');
  const clipboardState = useClipboardHistory();

  const renderContent = () => {
    switch (activeTab) {
      case 'clipboard':
        return <ClipCopyScreen {...clipboardState} />;
      case 'snippets':
        return <SnippetManagerScreen />;
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.layout}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <View style={styles.content}>{renderContent()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
});

export default App;
