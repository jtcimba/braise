import React from 'react';
import {Text, View, StyleSheet, FlatList, Image} from 'react-native';
import data from '../data.json';

type ItemProps = {title: string; image: string; time: number};

const Item = ({title, image, time}: ItemProps) => (
  <View style={styles.item}>
    <Image
      style={styles.image}
      source={{
        uri: image,
      }}
    />
    <View style={styles.itemBody}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.time}>{time} min</Text>
    </View>
  </View>
);

export default function RecipesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={data.data}
        renderItem={({item}) => {
          return (
            <Item
              title={item.title}
              image={item.image}
              time={item.total_time}
            />
          );
        }}
        keyExtractor={item => item.canonical_url}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
  item: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemBody: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  time: {
    color: '#666',
  },
  image: {
    width: 75,
    height: 75,
    marginRight: 10,
  },
});
