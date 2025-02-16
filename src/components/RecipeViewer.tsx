import React from 'react';
import {ScrollView, Text, View, Image, StyleSheet} from 'react-native';

export default function RecipeViewer({data}: any) {
  return (
    <ScrollView automaticallyAdjustKeyboardInsets={true}>
      <Image
        style={styles.image}
        source={{uri: data.image ? data.image : null}}
      />
      <View style={styles.bodyContainer}>
        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.subheader}>
          <View style={styles.itemBody}>
            <Text style={styles.subtext}>{data.author}</Text>
            {data.host && <Text style={styles.dot}>•</Text>}
            <Text style={styles.subtext}>{data.host}</Text>
          </View>
        </View>
        <View style={styles.subheader}>
          <Text style={styles.time}>{data.total_time}</Text>
          <Text style={styles.subtext}>{data.yields}</Text>
        </View>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.ingredientsContainer}>
          <Text style={styles.lineText}>{data.ingredients}</Text>
        </View>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionsContainer}>
          {data.instructions.split('\n').map((instruction: any, index: any) => {
            return (
              <View style={styles.lineContainer} key={index}>
                <Text style={styles.lineNumber}>{index + 1}.</Text>
                <Text style={styles.lineText}>{instruction}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    marginTop: 10,
    width: '100%',
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
    color: 'gray',
  },
  time: {
    color: '#666',
    overflow: 'hidden',
    paddingRight: 5,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 25,
    color: '#666',
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
    color: '#666',
  },
  lineText: {
    lineHeight: 30,
    flex: 1,
    alignSelf: 'flex-start',
  },
});
