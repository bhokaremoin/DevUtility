import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, spacing, typography, radii, MIN_TAP_TARGET} from '../theme';

export type Tab = 'clipboard' | 'snippets' | 'settings';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  onAddSnippet?: () => void;
}

const MAIN_TABS: {key: Tab; label: string}[] = [
  {key: 'clipboard', label: 'Clipboard'},
  {key: 'snippets', label: 'Snippets'},
];

export function TopHeader({
  activeTab,
  onTabChange,
  onClearAll,
  showClearAll,
  onAddSnippet,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.appTitle} accessibilityRole="header">
        DevUtility
      </Text>

      <View style={styles.tabGroup}>
        {MAIN_TABS.map(item => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(item.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} tab`}
              accessibilityState={{selected: isActive}}>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actions}>
        {showClearAll && onClearAll && (
          <TouchableOpacity
            onPress={onClearAll}
            activeOpacity={0.7}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear all clipboard history">
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'snippets' && onAddSnippet && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddSnippet}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Create new snippet">
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.settingsBtn, activeTab === 'settings' && styles.settingsBtnActive]}
          onPress={() => onTabChange('settings')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityState={{selected: activeTab === 'settings'}}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const HEADER_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  appTitle: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
    marginRight: spacing.xl,
    letterSpacing: 0.3,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.bg.secondary,
    borderRadius: radii.md,
    padding: spacing.xxs,
    alignSelf: 'center',
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + spacing.xxs,
    borderRadius: radii.md - spacing.xxs,
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.bg.hover,
  },
  tabLabel: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearButton: {
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  addButton: {
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  addButtonText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  settingsBtn: {
    width: MIN_TAP_TARGET - spacing.sm,
    height: MIN_TAP_TARGET - spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
  settingsBtnActive: {
    backgroundColor: colors.bg.hover,
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
});
