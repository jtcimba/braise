import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

interface ServingsPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (servings: string) => void;
  currentValue: string;
}

export default function ServingsPickerModal({
  visible,
  onClose,
  onConfirm,
  currentValue,
}: ServingsPickerModalProps) {
  const theme = useTheme() as unknown as Theme;
  const [selectedServings, setSelectedServings] = useState(currentValue || '-');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const servingsOptions = [
    '-',
    '0.5',
    ...Array.from({length: 20}, (_, i) => (i + 1).toString()),
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleConfirm = () => {
    onConfirm(selectedServings);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles(theme).overlay, {opacity: fadeAnim}]}>
          <TouchableWithoutFeedback>
            <View style={styles(theme).modalContainer}>
              <View style={styles(theme).header}>
                <Text style={styles(theme).title}>Select Servings</Text>
              </View>
              <View style={styles(theme).pickerContainer}>
                <Picker
                  selectedValue={selectedServings}
                  onValueChange={setSelectedServings}
                  style={styles(theme).picker}>
                  {servingsOptions.map(serving => (
                    <Picker.Item
                      key={serving}
                      label={serving}
                      value={serving}
                      color={theme.colors.text}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles(theme).buttonContainer}>
                <TouchableOpacity
                  style={styles(theme).cancelButton}
                  onPress={onClose}>
                  <Text style={styles(theme).cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles(theme).confirmButton}
                  onPress={handleConfirm}>
                  <Text style={styles(theme).confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      padding: 20,
      width: '80%',
      maxWidth: 300,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    pickerContainer: {
      marginBottom: 20,
    },
    picker: {
      height: 200,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...theme.typography.h4,
      color: theme.colors.subtext,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h4,
      color: theme.colors.background,
      fontWeight: '500',
    },
  });
