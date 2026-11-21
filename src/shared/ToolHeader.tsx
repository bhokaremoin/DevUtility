import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, spacing, typography, radii, MIN_TAP_TARGET, HEADER_HEIGHT} from './theme';

interface ToolHeaderProps {
  title: string;
  children: React.ReactNode;
}

export function ToolHeader({title, children}: ToolHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

interface HeaderButtonProps {
  testID: string;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  // Text-only buttons, as macOS toolbars do: the colour alone says how routine the action is.
  tone: 'danger' | 'accent' | 'quiet';
}

export function HeaderButton({testID, label, accessibilityLabel, onPress, tone}: HeaderButtonProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={tone === 'quiet' ? styles.iconButton : styles.textButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Text style={labelStyles[tone]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textButton: {
    minHeight: MIN_TAP_TARGET - spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconButton: {
    width: MIN_TAP_TARGET - spacing.sm,
    height: MIN_TAP_TARGET - spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
  },
});

const labelStyles = StyleSheet.create({
  danger: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  accent: {
    ...typography.bodyBold,
    color: colors.accent.primary,
  },
  quiet: {
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
});
