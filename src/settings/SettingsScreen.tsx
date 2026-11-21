import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ShortcutRecorder} from '../shared/native/ShortcutRecorder';
import {GlobalShortcut, ToolShortcutInfo} from '../shared/native/GlobalShortcut';
import {colors, spacing, typography, radii} from '../shared/theme';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.sectionTitle}>GLOBAL SHORTCUTS</Text>
      <View style={styles.sectionCard}>
        <Text style={styles.description}>
          Click a recorder and press a key combination. Each shortcut opens and closes its tool from
          any app.
        </Text>
        {GlobalShortcut.tools.map(tool => (
          <ToolShortcutRow key={tool.id} tool={tool} />
        ))}
      </View>
    </View>
  );
}

function ToolShortcutRow({tool}: {tool: ToolShortcutInfo}) {
  const [currentShortcut, setCurrentShortcut] = useState<string | null>(null);

  const refreshShortcut = useCallback(async () => {
    try {
      const shortcut = await GlobalShortcut.getShortcut(tool.id);
      setCurrentShortcut(shortcut?.description ?? null);
    } catch (error) {
      console.warn(`Could not read the ${tool.displayName} shortcut`, error);
      setCurrentShortcut(null);
    }
  }, [tool]);

  useEffect(() => {
    refreshShortcut();
  }, [refreshShortcut]);

  const resetShortcut = useCallback(() => {
    GlobalShortcut.resetShortcut(tool.id);
    // The native reset runs on the main queue after this call returns.
    setTimeout(refreshShortcut, 100);
  }, [tool, refreshShortcut]);

  return (
    <View style={styles.toolRow}>
      <View style={styles.recorderRow}>
        <Text style={styles.label}>{tool.displayName}</Text>
        <ShortcutRecorder toolId={tool.id} style={styles.recorder} />
      </View>
      <View style={styles.currentShortcutRow}>
        <Text style={styles.currentLabel}>Current:</Text>
        <Text testID={`settings.shortcut.${tool.id}.current`} accessible style={styles.currentValue}>
          {currentShortcut ?? tool.defaultShortcutLabel}
        </Text>
        <TouchableOpacity
          testID={`settings.shortcut.${tool.id}.reset`}
          style={styles.resetButton}
          onPress={resetShortcut}
          activeOpacity={0.7}>
          <Text style={styles.resetButtonText}>Reset to {tool.defaultShortcutLabel}</Text>
        </TouchableOpacity>
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
  sectionTitle: {
    ...typography.label,
    color: colors.accent.primary,
    marginBottom: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  toolRow: {
    marginBottom: spacing.lg,
  },
  recorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
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
    flex: 1,
  },
  resetButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  resetButtonText: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
