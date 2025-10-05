import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

export default function Item({item, navigation}: any) {
  const theme = useTheme() as unknown as Theme;

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
        <Text style={styles(theme).title}>{item.title}</Text>
        <View style={styles(theme).subtextContainer}>
          {item.author && (
            <Text style={styles(theme).author}>{item.author}</Text>
          )}
          {item.total_time && (
            <Text style={styles(theme).time}>
              {item.total_time} {item.total_time_unit}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      paddingVertical: 20,
      marginHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemBody: {
      flex: 1,
      marginEnd: 25,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    time: {
      ...theme.typography.b2,
      color: theme.colors.primary,
    },
    image: {
      width: 70,
      height: 70,
      marginRight: 15,
      backgroundColor: theme.colors.border,
      borderRadius: 7,
    },
    author: {
      overflow: 'hidden',
      ...theme.typography.b2,
      color: theme.colors.text,
    },
    subtextContainer: {
      flexDirection: 'row',
      gap: 10,
    },
  });
