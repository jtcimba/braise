import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity} from 'react-native-gesture-handler';

const Item = ({item, navigation}: any) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => navigation.navigate('RecipeDetailsScreen', {item: item})}>
    <Image
      style={styles.image}
      source={{
        uri: item.image,
      }}
    />
    <View style={styles.itemBody}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.time}>
        {item.total_time ? item.total_time + ' min' : ''}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function RecipesScreen() {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const navigation = useNavigation();

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
        <View style={styles.container}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              style={styles.container}
              data={data}
              renderItem={({item}) => {
                return <Item item={item} navigation={navigation} />;
              }}
              keyExtractor={item => item.canonical_url}
            />
          )}
        </View>
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
    borderBottomColor: '#eee',
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
