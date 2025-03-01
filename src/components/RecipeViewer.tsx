import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';

export default function RecipeViewer({data}: any) {
  const theme = useTheme();

  const handleHostPress = () => {
    if (data.canonical_url) {
      Linking.openURL(data.canonical_url);
    }
  };

  return (
    <ScrollView automaticallyAdjustKeyboardInsets={true}>
      <Image
        style={styles(theme).image}
        source={{uri: data.image ? data.image : null}}
      />
      <View style={styles(theme).bodyContainer}>
        <Text style={styles(theme).title}>{data.title}</Text>
        <View style={styles(theme).subheader}>
          <View style={styles(theme).itemBody}>
            <Text style={styles(theme).subtext}>{data.author}</Text>
            {data.host && <Text style={styles(theme).dot}>•</Text>}
            {data.host && (
              <TouchableOpacity onPress={handleHostPress}>
                <Text style={[styles(theme).subtext, styles(theme).host]}>
                  {data.host}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles(theme).subheader}>
          <Text
            style={[
              styles(theme).time,
              data.total_time ? styles(theme).paddingRight : null,
            ]}>
            {data.total_time}
          </Text>
          <Text style={styles(theme).subtext}>{data.yields}</Text>
        </View>
        {data.ingredients && (
          <>
            <Text style={styles(theme).sectionTitle}>Ingredients</Text>
            <View style={styles(theme).ingredientsContainer}>
              <Text
                style={[styles(theme).lineText, styles(theme).lineContainer]}>
                {data.ingredients}
              </Text>
            </View>
          </>
        )}
        {data.instructions && (
          <>
            <Text style={styles(theme).sectionTitle}>Instructions</Text>
            <View style={styles(theme).instructionsContainer}>
              {data.instructions
                .split('\n')
                .map((instruction: any, index: any) => {
                  return (
                    <View style={styles(theme).lineContainer} key={index}>
                      <Text style={styles(theme).lineNumber}>{index + 1}.</Text>
                      <Text style={styles(theme).lineText}>{instruction}</Text>
                    </View>
                  );
                })}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    image: {
      width: '100%',
      height: 300,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      marginTop: 10,
      width: '100%',
      color: theme.colors.text,
    },
    subheader: {
      flexDirection: 'row',
      alignContent: 'center',
      marginTop: 5,
      width: '100%',
    },
    dot: {
      marginHorizontal: 5,
    },
    itemBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subtext: {
      fontSize: 16,
      color: theme.colors.subtext,
    },
    host: {
      textDecorationLine: 'underline',
    },
    time: {
      fontSize: 16,
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      marginTop: 25,
      color: theme.colors.subtext,
    },
    instructionsContainer: {
      flex: 1,
      marginBottom: 25,
    },
    ingredientsContainer: {
      flex: 1,
    },
    lineContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 5,
    },
    lineNumber: {
      lineHeight: 30,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    lineText: {
      lineHeight: 30,
      flex: 1,
      alignSelf: 'flex-start',
      color: theme.colors.text,
    },
    paddingRight: {
      paddingRight: 5,
    },
  });
