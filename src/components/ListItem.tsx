import React, {useState, useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function Item({item, navigation, isFirst}: any) {
  const theme = useTheme() as unknown as Theme;
  const [descriptionLines, setDescriptionLines] = useState(2);

  const onTitleTextLayout = useCallback(
    (e: {nativeEvent: {lines: unknown[]}}) => {
      const titleLines = e.nativeEvent.lines.length;
      setDescriptionLines(titleLines === 2 ? 1 : 2);
    },
    [],
  );

  return (
    <TouchableOpacity
      style={[styles(theme).item, isFirst && {paddingTop: 8}]}
      onPress={() => navigation.navigate('RecipeDetailsScreen', {item: item})}>
      <Image
        style={styles(theme).image}
        source={{
          uri: item.image ? item.image : null,
        }}
      />
      <View style={styles(theme).itemBody}>
        <Text
          style={styles(theme).title}
          numberOfLines={2}
          ellipsizeMode="tail"
          onTextLayout={onTitleTextLayout}>
          {item.title}
        </Text>
        {item.total_time && (
          <View style={styles(theme).timeContainer}>
            <Text style={styles(theme).time}>
              {item.total_time} {item.total_time_unit.toUpperCase() || 'MIN'}
            </Text>
          </View>
        )}
        <Text
          style={styles(theme).description}
          numberOfLines={descriptionLines}
          ellipsizeMode="tail">
          {item.about ? item.about : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = (theme: Theme) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      paddingVertical: 20,
      paddingTop: 20,
      marginHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
      gap: 14,
    },
    itemBody: {
      flex: 1,
      gap: 5,
      overflow: 'hidden',
    },
    title: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
    },
    image: {
      width: 90,
      height: 90,
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 12,
      flexShrink: 0,
    },
    time: {
      ...theme.typography.h4,
      color: theme.colors['green-400'],
    },
    timeContainer: {
      alignSelf: 'flex-start',
      borderRadius: 40,
    },
    description: {
      ...theme.typography.b1,
      color: theme.colors['toffee-400'],
    },
  });
