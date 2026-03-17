import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {ClipCopyScreen} from './screens';

function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <ClipCopyScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});

export default App;
