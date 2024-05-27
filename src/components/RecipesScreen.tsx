import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';

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
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const getRecipes = async () => {
    try {
      const response = await fetch(`${process.env.API_URL}recipes?userid=1`);
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecipes();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          style={styles.container}
          data={data}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
