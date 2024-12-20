import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {RecipeService} from '../api';

const Item = ({item, navigation}: any) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => navigation.navigate('DetailsScreen', {item: item})}>
    <View>
      <Image
        style={styles.image}
        source={{
          uri: item.image,
        }}
        defaultSource={require('../assets/images/placeholder.png')}
      />
    </View>
    <View style={styles.itemBody}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtext}>{item.author}</Text>
      <Text style={styles.time}>{item.total_time}</Text>
    </View>
  </TouchableOpacity>
);

const NoRecipes = () => (
  <View style={styles.noRecipes}>
    <Text style={styles.subtext}>No recipes found</Text>
  </View>
);

export default function RecipesScreen({route}: any) {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes().then(() => {
      setRefreshing(false);
    });
  };

  const fetchRecipes = async () => {
    const recipes = await RecipeService.getRecipes();
    setData(recipes);
  };

  useEffect(() => {
    setLoading(true);
    fetchRecipes().then(() => {
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.refresh) {
        fetchRecipes();
      }
    }, [route.params]),
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.container}
          data={data}
          renderItem={({item}) => {
            return <Item item={item} navigation={navigation} />;
          }}
          keyExtractor={item => item.id}
          ListEmptyComponent={!refreshing ? <NoRecipes /> : null}
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
    borderBottomColor: '#D4D4D4',
  },
  itemBody: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  time: {
    color: '#666',
  },
  image: {
    width: 75,
    height: 75,
    marginRight: 10,
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
  noRecipes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
