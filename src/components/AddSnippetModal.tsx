import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Snippet} from '../types';
import {parseTags} from '../utils';
import {
  colors,
  spacing,
  typography,
  radii,
  MIN_TAP_TARGET,
} from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Snippet, 'id' | 'createdAt'>) => void;
}

export function AddSnippetModal({visible, onClose, onSave}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  if (!visible) {
    return null;
  }

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  function handleSave() {
    if (!canSave) {
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      tags: parseTags(tags),
    });
    resetAndClose();
  }

  function resetAndClose() {
    setTitle('');
    setDescription('');
    setTags('');
    setContent('');
    onClose();
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.heading} accessibilityRole="header">
          New Snippet
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Nginx reverse proxy"
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel="Snippet title"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description of the snippet"
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel="Snippet description"
          />

          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. nginx, docker, devops"
            placeholderTextColor={colors.text.placeholder}
            accessibilityLabel="Snippet tags"
          />

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Paste your code, query, or script here…"
            placeholderTextColor={colors.text.placeholder}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Snippet content"
          />
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetAndClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel creating snippet">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={canSave ? 0.7 : 1}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save snippet"
            accessibilityState={{disabled: !canSave}}>
            <Text
              style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
              Save Snippet
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: spacing.xxl,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xxl,
  },
  heading: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  scroll: {
    flexGrow: 0,
  },
  label: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.xs + spacing.xxs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xxs,
    ...typography.body,
    color: colors.text.secondary,
  },
  contentInput: {
    minHeight: 160,
    ...typography.code,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm + spacing.xxs,
    marginTop: spacing.xl,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
  },
  cancelText: {
    ...typography.bodyBold,
    color: colors.text.tertiary,
  },
  saveButton: {
    paddingHorizontal: spacing.xl,
    minHeight: MIN_TAP_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  saveButtonDisabled: {
    backgroundColor: colors.bg.surface,
  },
  saveText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  saveTextDisabled: {
    color: colors.text.placeholder,
  },
});
