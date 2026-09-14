import React, {useState, useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {isTablet} from '../hooks/useTablet';

export default function Item({item, navigation, isFirst}: any) {
  const theme = useTheme() as unknown as Theme;
  const [descriptionLines, setDescriptionLines] = useState(2);

  const isPending = item.import_status === 'pending';
  const isNew =
    !item.viewed_at &&
    item.import_status === 'complete' &&
    !!item.created_at &&
    Date.now() - new Date(item.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  const onTitleTextLayout = useCallback(
    (e: {nativeEvent: {lines: unknown[]}}) => {
      const titleLines = e.nativeEvent.lines.length;
      setDescriptionLines(titleLines === 2 ? 1 : 2);
    },
    [],
  );

  return (
    <TouchableOpacity
      style={[
        styles(theme).item,
        isFirst && styles(theme).itemFirst,
        isPending && styles(theme).itemPending,
      ]}
      disabled={isPending}
      onPress={() => navigation.navigate('RecipeDetailsScreen', {item: item})}>
      {isPending ? (
        <View style={styles(theme).imagePlaceholder} />
      ) : (
        <Image
          style={styles(theme).image}
          source={{
            uri: item.image ? item.image : null,
          }}
        />
      )}
      <View style={styles(theme).itemBody}>
        <View style={styles(theme).itemContent}>
          <Text
            style={styles(theme).title}
            numberOfLines={2}
            ellipsizeMode="tail"
            onTextLayout={isPending ? undefined : onTitleTextLayout}>
            {isPending ? 'Importing recipe…' : item.title}
          </Text>
          {!isPending && item.total_time && (
            <View style={styles(theme).timeContainer}>
              <Text style={styles(theme).time}>
                {item.total_time} {item.total_time_unit || 'min'}
              </Text>
            </View>
          )}
          {!isPending && (
            <Text
              style={styles(theme).description}
              numberOfLines={descriptionLines}
              ellipsizeMode="tail">
              {item.about ? item.about : ''}
            </Text>
          )}
        </View>
        {isNew && (
          <View style={styles(theme).newBadge}>
            <Text style={styles(theme).newBadgeText}>New</Text>
          </View>
        )}
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
    itemFirst: {
      paddingTop: 8,
    },
    itemPending: {
      opacity: 0.4,
    },
    itemBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    itemContent: {
      flex: 1,
      gap: 5,
      overflow: 'hidden',
    },
    title: {
      ...theme.typography['h2-emphasized'],
      color: theme.colors['neutral-800'],
      marginTop: 2,
    },
    newBadge: {
      backgroundColor: theme.colors['yellow-400'],
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    newBadgeText: {
      ...theme.typography.b1,
      color: theme.colors['yellow-600'],
    },
    image: {
      width: isTablet() ? 110 : 90,
      height: isTablet() ? 110 : 90,
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 12,
      flexShrink: 0,
    },
    imagePlaceholder: {
      width: isTablet() ? 110 : 90,
      height: isTablet() ? 110 : 90,
      backgroundColor: theme.colors['neutral-300'],
      borderRadius: 12,
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    time: {
      ...theme.typography.h4,
      color: theme.colors['neutral-800'],
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
