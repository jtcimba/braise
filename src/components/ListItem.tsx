import React, {useState, useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function Item({item, navigation}: any) {
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
      style={styles(theme).item}
      onPress={() => navigation.navigate('RecipeDetailsScreen', {item: item})}>
      <View>
        <Image
          style={styles(theme).image}
          source={{
            uri: item.image ? item.image : null,
          }}
        />
      </View>
      <View style={styles(theme).itemBody}>
        <View>
          <Text
            style={styles(theme).title}
            numberOfLines={2}
            ellipsizeMode="tail"
            onTextLayout={onTitleTextLayout}>
            {item.title}
          </Text>
          <View style={styles(theme).subtextContainer}>
            {item.total_time && (
              <Text style={styles(theme).time}>
                {item.total_time} {item.total_time_unit || 'min'}
              </Text>
            )}
          </View>
        </View>
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

const styles = (theme: any) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      height: 118,
      paddingVertical: 20,
      marginHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors['neutral-300'],
    },
    itemBody: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 0,
      overflow: 'hidden',
    },
    title: {
      ...theme.typography['h3-emphasized'],
      color: theme.colors['neutral-800'],
    },
    image: {
      width: 78,
      height: 78,
      marginRight: 12,
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 8,
    },
    time: {
      overflow: 'hidden',
      ...theme.typography.h4,
      color: theme.colors['rust-600'],
    },
    subtextContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    description: {
      ...theme.typography.b2,
      color: theme.colors['neutral-400'],
    },
  });
