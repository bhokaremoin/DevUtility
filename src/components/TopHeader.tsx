/**
 * @file components/TopHeader.tsx
 * @description Fixed header bar containing the app title, tab switcher, and
 * contextual action buttons.
 *
 * Architecture Role: Global navigation shell rendered by `App.tsx` above all
 * screen content. Hosts the Clipboard/Snippets tab group, the settings gear,
 * the "?" help button, and context-sensitive actions (Clear All, + New).
 */

import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, spacing, typography, radii, MIN_TAP_TARGET, HEADER_HEIGHT} from '../theme';

/** The three top-level navigation tabs available in the app. */
export type Tab = 'clipboard' | 'snippets' | 'settings';

/** Props for the `TopHeader` component. */
interface Props {
  /** Currently active tab — controls which tab appears highlighted. */
  activeTab: Tab;
  /** Called when the user taps a tab or the settings gear. */
  onTabChange: (tab: Tab) => void;
  /** Called when the user confirms "Clear All" for clipboard history. */
  onClearAll?: () => void;
  /** When `true`, renders the "Clear All" button (clipboard tab with items). */
  showClearAll?: boolean;
  /** Called when the user taps "+ New" on the snippets tab. */
  onAddSnippet?: () => void;
  /** Called when the user taps the "?" help button. */
  onHelpPress?: () => void;
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
  onHelpPress,
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
        {onHelpPress && (
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={onHelpPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Keyboard shortcuts">
            <Text style={styles.helpIcon}>?</Text>
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
    marginRight: spacing.xl,
    letterSpacing: 0.5,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xxs,
    alignSelf: 'center',
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + spacing.xxs,
    borderRadius: radii.lg - spacing.xxs,
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.border,
  },
  tabLabel: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.accent.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Text-only button — no background or border intentionally. macOS toolbar
  // convention for destructive actions: color alone signals the danger level
  // without a filled box competing with the rest of the header.
  clearButton: {
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  clearText: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  // Text-only button — matches the same pattern as clearButton above.
  // The accent color is enough affordance for a non-destructive action;
  // a filled CTA here would over-emphasise a routine "create" action.
  addButton: {
    paddingHorizontal: spacing.sm,
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    ...typography.bodyBold,
    color: colors.accent.primary,
  },
  helpBtn: {
    width: MIN_TAP_TARGET - spacing.sm,
    height: MIN_TAP_TARGET - spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
  helpIcon: {
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  settingsBtn: {
    width: MIN_TAP_TARGET - spacing.sm,
    height: MIN_TAP_TARGET - spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
  settingsBtnActive: {
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.border,
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
});
