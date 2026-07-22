import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface CollectionNameSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialValue?: string;
  title?: string;
  confirmLabel?: string;
}

export default function CollectionNameSheet({
  visible,
  onClose,
  onSubmit,
  initialValue = '',
  title = 'New collection',
  confirmLabel = 'Create',
}: CollectionNameSheetProps) {
  const theme = useTheme() as unknown as Theme;
  const [name, setName] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, initialValue]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      style={styles(theme).overlay}
      avoidKeyboard>
      <View style={styles(theme).sheet}>
        <View style={styles(theme).header}>
          <Text style={styles(theme).title}>{title}</Text>
        </View>
        <TextInput
          ref={inputRef}
          style={styles(theme).input}
          placeholder="Collection name"
          placeholderTextColor={theme.colors['toffee-400']}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="words"
          selectTextOnFocus
        />
        <View style={styles(theme).buttons}>
          <TouchableOpacity
            style={styles(theme).cancelButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={styles(theme).cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles(theme).confirmButton,
              !name.trim() && styles(theme).confirmButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            activeOpacity={0.7}>
            {isSubmitting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors['neutral-100']}
              />
            ) : (
              <Text style={styles(theme).confirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    sheet: {
      backgroundColor: theme.colors['neutral-100'],
      borderRadius: 25,
      paddingHorizontal: 25,
      paddingTop: 10,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      marginBottom: 16,
    },
    title: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 20,
      ...theme.typography.h2,
      color: theme.colors['neutral-800'],
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      alignItems: 'center',
    },
    cancelText: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.colors['neutral-800'],
      alignItems: 'center',
    },
    confirmButtonDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      ...theme.typography.h4,
      color: theme.colors['neutral-100'],
      fontWeight: '500',
    },
  });
