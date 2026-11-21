import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SettingsScreen} from './SettingsScreen';
import {colors} from '../shared/theme';

export function SettingsWindow(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
});
