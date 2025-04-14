import React, {useState} from 'react';
import {View, TextInput, StyleSheet, ScrollView, Keyboard} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import FilterChip from './FilterChip';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: string[]) => void;
}

const FILTER_OPTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Quick',
  'Healthy',
];

export default function SearchAndFilters({
  onSearch,
  onFiltersChange,
}: SearchAndFiltersProps) {
  const theme = useTheme() as unknown as Theme;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <View style={styles(theme).container}>
      <TextInput
        style={styles(theme).searchInput}
        placeholder="Search recipes..."
        placeholderTextColor={theme.colors.subtext}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles(theme).filtersContainer}>
        {FILTER_OPTIONS.map(filter => (
          <FilterChip
            key={filter}
            label={filter}
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
      padding: 8,
      backgroundColor: theme.colors.background,
    },
    searchInput: {
      height: 36,
      backgroundColor: theme.colors.background,
      borderRadius: 18,
      paddingHorizontal: 12,
      marginBottom: 8,
      color: theme.colors.text,
    },
    filtersContainer: {
      flexDirection: 'row',
      marginBottom: 4,
    },
  });
