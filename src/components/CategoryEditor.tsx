import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CategoryEditorProps {
  categories: string[];
  onChange: (categories: string[]) => void;
}

export default function CategoryEditor({
  categories,
  onChange,
}: CategoryEditorProps) {
  const theme = useTheme() as unknown as Theme;
  const [newCategory, setNewCategory] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setNewCategory('');
      return;
    }

    onChange([...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleSubmitEditing = () => {
    handleAddCategory();
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    onChange(categories.filter(category => category !== categoryToRemove));
  };

  const capitalizeFirstLetter = (text: string) => {
    if (!text) {
      return '';
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <View>
      <View style={styles(theme).chipsContainer}>
        {categories?.map(category => (
          <View key={category} style={styles(theme).chip}>
            <Text style={styles(theme).chipText}>
              {capitalizeFirstLetter(category)}
            </Text>
            <TouchableOpacity
              style={styles(theme).removeButton}
              onPress={() => handleRemoveCategory(category)}>
              <Ionicons name="close" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles(theme).inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles(theme).input}
            placeholder="Add a category..."
            placeholderTextColor={theme.colors.subtext}
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="done"
            blurOnSubmit={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 15,
      marginBottom: 5,
      color: theme.colors.text,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    chip: {
      height: 30,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundText,
      borderRadius: 15,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    chipText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    removeButton: {
      marginLeft: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 30,
      marginBottom: 8,
    },
    input: {
      height: 30,
      backgroundColor: theme.colors.background,
      borderRadius: 15,
      color: theme.colors.text,
      minWidth: 150,
    },
  });
