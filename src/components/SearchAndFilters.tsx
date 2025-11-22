import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import FilterChip from './FilterChip';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: string[]) => void;
  filterOptions: string[];
}

export default function SearchAndFilters({
  onSearch,
  onFiltersChange,
  filterOptions,
}: SearchAndFiltersProps) {
  const theme = useTheme() as unknown as Theme;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const capitalizeFirstLetter = (text: string) => {
    if (!text) {
      return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).searchInputContainer}>
        <TextInput
          style={styles(theme).searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={theme.colors.text}
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
              color={theme.colors.border}
            />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles(theme).filtersContainer}>
        {filterOptions.map(filter => (
          <FilterChip
            key={filter}
            label={capitalizeFirstLetter(filter)}
            selected={selectedFilters.includes(filter)}
            onPress={() => toggleFilter(filter)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingBottom: 10,
    },
    searchInputContainer: {
      marginHorizontal: 15,
      marginBottom: 10,
      position: 'relative',
    },
    searchInput: {
      height: 36,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingRight: 40,
      color: theme.colors.text,
      textAlignVertical: 'center',
      includeFontPadding: false,
      ...theme.typography.h5,
    },
    clearButton: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: [{translateY: -12}],
      padding: 2,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingStart: 15,
      marginEnd: 25,
      overflow: 'visible',
    },
  });
