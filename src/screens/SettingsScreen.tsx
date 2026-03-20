/**
 * @file screens/SettingsScreen.tsx
 * @description Settings screen for configuring the global toggle shortcut and
 * viewing app behaviour documentation.
 *
 * Architecture Role: One of three top-level screens in `App.tsx`. Hosts the
 * native `ShortcutRecorder` component and reads the active shortcut via
 * `GlobalShortcut.getShortcut()`. Provides a reset button to restore the
 * factory default (Ctrl+Option+D).
 */

import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ShortcutRecorder} from '../native/ShortcutRecorder';
import {GlobalShortcut} from '../native/GlobalShortcut';
import {colors, spacing, typography, radii} from '../theme';
import {DEFAULT_SHORTCUT_LABEL} from '../constants';

export function SettingsScreen() {
  const [currentShortcut, setCurrentShortcut] = useState<string | null>(null);

  const refreshShortcut = useCallback(async () => {
    try {
      const shortcut = await GlobalShortcut.getShortcut();
      setCurrentShortcut(shortcut?.description ?? null);
    } catch {
      setCurrentShortcut(null);
    }
  }, []);

  useEffect(() => {
    refreshShortcut();
  }, [refreshShortcut]);

  const handleReset = useCallback(() => {
    GlobalShortcut.resetShortcut();
    setTimeout(refreshShortcut, 100);
  }, [refreshShortcut]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GLOBAL SHORTCUT</Text>
        <Text style={styles.description}>
          Click the recorder below and press your preferred key combination to
          toggle DevUtility from anywhere. The shortcut works even when the app
          is not in focus.
        </Text>

        <View style={styles.recorderRow}>
          <Text style={styles.label}>Toggle Shortcut</Text>
          <ShortcutRecorder style={styles.recorder} />
        </View>

        <View style={styles.currentShortcutRow}>
          <Text style={styles.currentLabel}>Current:</Text>
          <Text style={styles.currentValue}>
            {currentShortcut ?? DEFAULT_SHORTCUT_LABEL}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>
            Reset to Default ({DEFAULT_SHORTCUT_LABEL})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BEHAVIOR</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Menu Bar Icon</Text>
          <Text style={styles.infoValue}>Click to toggle visibility</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dismiss</Text>
          <Text style={styles.infoValue}>
            Press Esc or click outside the window
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Positioning</Text>
          <Text style={styles.infoValue}>
            Appears centered on the active screen; drag to reposition
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xxl,
  },
  heading: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  recorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginRight: spacing.lg,
  },
  recorder: {
    width: 200,
    height: 28,
  },
  currentShortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  currentLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  currentValue: {
    ...typography.caption,
    color: colors.text.primary,
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
  },
  resetButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.tertiary,
    flexShrink: 1,
    textAlign: 'right',
  },
});
