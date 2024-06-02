import React from 'react';
import {Text, View, StyleSheet, Image} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

export default function RecipeDetailsScreen({route}: any) {
  const {
    title,
    total_time,
    image,
    yields,
    host,
    author,
    ingredients,
    instructions,
  } = route.params.item;

  const instructionsList = instructions.toString().split('\\n');

  return (
    <ScrollView style={styles.container}>
      <Image style={styles.image} source={{uri: image}} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.subheader}>
        <View style={styles.itemBody}>
          <Text style={styles.subtext}>{author}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.subtext}>{host}</Text>
        </View>
      </View>
      <View style={styles.subheader}>
        <Text style={total_time ? styles.duration : null}>
          {total_time ? total_time + ' min' : null}
        </Text>
        <Text style={styles.subtext}>{yields}</Text>
      </View>
      <Text style={styles.sectionTitle}>Ingredients</Text>
      <View style={styles.ingredientsContainer}>
        {ingredients.map((ingredient: any, index: any) => {
          return (
            <View style={styles.itemContainer} key={index}>
              <Text>{ingredient}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>Instructions</Text>
      <View style={styles.instructionsContainer}>
        {instructionsList.map((instruction: any, index: any) => {
          return (
            <View style={styles.itemContainer} key={index}>
              <Text style={styles.instructionCount}>{index + 1}.</Text>
              <Text style={styles.instructionItem}>{instruction}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  title: {
    fontSize: 20,
    marginTop: 10,
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
  duration: {
    color: '#666',
    overflow: 'hidden',
    paddingRight: 10,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  subheader: {
    flexDirection: 'row',
    marginTop: 5,
    width: '100%',
  },
  dot: {
    marginHorizontal: 5,
  },
  ingredientsContainer: {
    flex: 1,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 15,
    marginTop: 25,
    color: '#666',
  },
  instructionItem: {
    lineHeight: 30,
    flex: 1,
  },
  instructionCount: {
    lineHeight: 30,
    marginRight: 10,
    color: '#666',
  },
  instructionsContainer: {
    flex: 1,
    paddingBottom: 25,
  },
});
