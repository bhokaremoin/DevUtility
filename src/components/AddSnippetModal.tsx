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
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
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
        <Text style={styles.heading}>New Snippet</Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Nginx reverse proxy"
            placeholderTextColor="#5a5a7a"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description of the snippet"
            placeholderTextColor="#5a5a7a"
          />

          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. nginx, docker, devops"
            placeholderTextColor="#5a5a7a"
          />

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Paste your code, query, or script here…"
            placeholderTextColor="#5a5a7a"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetAndClose}
            activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={canSave ? 0.7 : 1}
            disabled={!canSave}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    backgroundColor: '#1e1e3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    padding: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e0e0f0',
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8aaa',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#14142a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#e0e0f0',
  },
  contentInput: {
    minHeight: 160,
    fontFamily: 'Menlo',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a8aaa',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4a4aff',
  },
  saveButtonDisabled: {
    backgroundColor: '#2a2a4a',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveTextDisabled: {
    color: '#5a5a7a',
  },
});
