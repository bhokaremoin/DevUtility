/**
 * @file components/ShortcutsModal.tsx
 * @description Overlay modal that lists all keyboard shortcuts in grouped sections.
 *
 * Architecture Role: Read-only reference UI triggered by the "?" button in
 * `TopHeader`. Renders `SHORTCUT_SECTIONS` data as styled key-badge rows.
 * Contains a zero-size invisible `TextInput` focus trap so macOS routes key
 * events to the React layer while the modal is open.
 */

import React, {useEffect, useRef} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {SHORTCUT_SECTIONS, ShortcutRow} from '../data/shortcuts';

/** Props for the `ShortcutsModal` component. */
interface Props {
  /** Controls modal visibility; renders nothing when `false`. */
  visible: boolean;
  /** Called when the user presses the close (✕) button. */
  onClose: () => void;
}

function KbdTag({label}: {label: string}) {
  return (
    <View style={styles.kbd}>
      <Text style={styles.kbdText}>{label}</Text>
    </View>
  );
}

function ShortcutRowView({action, keys, isLast}: ShortcutRow & {isLast: boolean}) {
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <Text style={styles.actionText}>{action}</Text>
      <View style={styles.keysRow}>
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Text style={styles.plus}>+</Text>}
            <KbdTag label={key} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export function ShortcutsModal({visible, onClose}: Props) {
  const focusTrapRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => focusTrapRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.backdrop}>
      <TextInput ref={focusTrapRef} style={styles.focusTrap} editable={false} />
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            Keyboard Shortcuts
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close shortcuts">
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {SHORTCUT_SECTIONS.map((section, si) => (
            <View key={section.title} style={si > 0 ? styles.section : styles.sectionFirst}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              {section.rows.map((row, ri) => (
                <ShortcutRowView key={row.action} {...row} isLast={ri === section.rows.length - 1} />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  focusTrap: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  card: {
    width: 460,
    maxHeight: '85%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  cardTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  closeText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionFirst: {
    // no top margin for the first section
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + spacing.xxs,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  actionText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xl,
  },
  keysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  plus: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginHorizontal: 1,
  },
  kbd: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  kbdText: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: colors.text.primary,
  },
});
