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

interface TotalTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: string, unit: string) => void;
  currentTime: string;
  currentUnit: string;
}

export default function TotalTimePickerModal({
  visible,
  onClose,
  onConfirm,
  currentTime,
  currentUnit,
}: TotalTimePickerModalProps) {
  const theme = useTheme() as unknown as Theme;
  const [selectedTime, setSelectedTime] = useState(currentTime || '-');
  const [selectedUnit, setSelectedUnit] = useState(currentUnit || '-');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const timeOptions = [
    '-',
    ...Array.from({length: 180}, (_, i) => (i + 1).toString()),
  ];
  const unitOptions = ['-', 'min', 'hr'];

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
    onConfirm(selectedTime, selectedUnit);
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
                <Text style={styles(theme).title}>Select Total Time</Text>
              </View>
              <View style={styles(theme).pickerRow}>
                <View style={styles(theme).pickerContainer}>
                  <Picker
                    selectedValue={selectedTime}
                    onValueChange={setSelectedTime}
                    style={styles(theme).picker}>
                    {timeOptions.map(time => (
                      <Picker.Item
                        key={time}
                        label={time}
                        value={time}
                        color={theme.colors.text}
                      />
                    ))}
                  </Picker>
                </View>
                <View style={styles(theme).pickerContainer}>
                  <Picker
                    selectedValue={selectedUnit}
                    onValueChange={setSelectedUnit}
                    style={styles(theme).picker}>
                    {unitOptions.map(unit => (
                      <Picker.Item
                        key={unit}
                        label={unit}
                        value={unit}
                        color={theme.colors.text}
                      />
                    ))}
                  </Picker>
                </View>
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
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    pickerRow: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 20,
    },
    pickerContainer: {
      flex: 1,
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
      borderRadius: 8,
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
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      ...theme.typography.h4,
      color: theme.colors.background,
      fontWeight: '500',
    },
  });
