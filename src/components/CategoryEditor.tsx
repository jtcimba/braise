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
            placeholder="Add a tag..."
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
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 15,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginRight: 10,
      marginBottom: 5,
    },
    chipText: {
      color: theme.colors.text,
      ...theme.typography.h5,
      lineHeight: 15,
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    removeButton: {
      marginLeft: 4,
      width: 16,
      height: 16,
      backgroundColor: theme.colors.background,
    },
    removeButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    input: {
      ...theme.typography.h5,
      color: theme.colors.text,
      minWidth: 150,
    },
  });
