import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
        {item.author && (
          <Text style={styles(theme).subtext}>{item.author}</Text>
        )}
        <View style={styles(theme).timeContainer}>
          {item.total_time ? (
            <>
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.colors.primary}
                style={styles(theme).icon}
              />
              <Text style={styles(theme).time}>
                {item.total_time} {item.total_time_unit}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemBody: {
      flex: 1,
    },
    title: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    time: {
      color: theme.colors.subtext,
      ...theme.typography.b2,
    },
    image: {
      width: 75,
      height: 75,
      marginRight: 10,
      backgroundColor: theme.colors.border,
      borderRadius: 13,
    },
    subtext: {
      overflow: 'hidden',
      ...theme.typography.b2,
      color: theme.colors.subtext,
    },
    icon: {
      marginRight: 3,
    },
  });
