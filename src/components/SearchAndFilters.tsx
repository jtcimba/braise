import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  sortLabel: string;
  onSortPress: () => void;
}

export default function SearchAndFilters({
  onSearch,
  sortLabel,
  onSortPress,
}: SearchAndFiltersProps) {
  const theme = useTheme() as unknown as Theme;
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).searchInputContainer}>
        <TextInput
          style={styles(theme).searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={theme.colors['toffee-400']}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles(theme).clearButton}
            onPress={clearSearch}
            activeOpacity={0.7}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors['toffee-400']}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles(theme).sortRow}>
        <TouchableOpacity
          onPress={onSortPress}
          activeOpacity={0.5}
          style={styles(theme).sortButton}>
          <Text style={styles(theme).sortLabel}>{sortLabel}</Text>
          <Ionicons
            name="swap-vertical"
            size={14}
            color={theme.colors['toffee-400']}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginTop: 10,
    },
    searchInputContainer: {
      marginHorizontal: 15,
      marginBottom: 10,
      position: 'relative',
    },
    searchInput: {
      height: 36,
      borderWidth: 1,
      borderColor: theme.colors['neutral-300'],
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingRight: 40,
      backgroundColor: theme.colors['neutral-100'],
      textAlignVertical: 'center',
      includeFontPadding: false,
      ...theme.typography.h4,
    },
    clearButton: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: [{translateY: -12}],
      padding: 2,
    },
    sortRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sortLabel: {
      ...theme.typography.h4,
      color: theme.colors['toffee-400'],
    },
  });
