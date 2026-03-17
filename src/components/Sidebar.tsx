import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, spacing, typography, radii, MIN_TAP_TARGET} from '../theme';

export type Tab = 'clipboard' | 'snippets';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NAV_ITEMS: {key: Tab; label: string}[] = [
  {key: 'clipboard', label: 'Clipboard'},
  {key: 'snippets', label: 'Snippets'},
];

export function Sidebar({activeTab, onTabChange}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.appTitle} accessibilityRole="header">
        DevUtility
      </Text>

      <View style={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onTabChange(item.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} tab`}
              accessibilityState={{selected: isActive}}>
              <Text
                style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 200;

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.bg.primary,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  appTitle: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  nav: {
    gap: spacing.xs,
  },
  navItem: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  navItemActive: {
    backgroundColor: colors.bg.hover,
  },
  navLabel: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
  },
  navLabelActive: {
    color: colors.accent.primary,
  },
});
