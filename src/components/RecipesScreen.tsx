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
import {getCurrentUser, AuthUser} from 'aws-amplify/auth';

const Item = ({item, navigation}: any) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => navigation.navigate('DetailsScreen', {item: item})}>
    <Image
      style={styles.image}
      source={{
        uri: item.image,
      }}
    />
    <View style={styles.itemBody}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtext}>{item.author}</Text>
      <Text style={styles.time}>{item.total_time}</Text>
    </View>
  </TouchableOpacity>
);

export default function RecipesScreen() {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const navigation = useNavigation();
  const [awsId, setAwsId] = useState<string | undefined>('');
  const [userId, setUserId] = useState<string | undefined>('');

  useEffect(() => {
    setLoading(true);
    getCurrentUser()
      .then((user: AuthUser | undefined) => {
        if (user?.signInDetails) {
          setAwsId(user.userId);
        }
      })
      .catch(e => console.log(e.message));
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (awsId) {
      fetch(`${process.env.API_URL}users?awsid=${awsId}`)
        .then(response => response.json())
        .then(json => setUserId(json[0]?.id))
        .catch(e => console.log(e.message));
    }
    setLoading(false);
  }, [awsId]);

  useEffect(() => {
    setLoading(true);
    if (userId) {
      fetch(`${process.env.API_URL}recipes?userid=${userId}`)
        .then(response => response.json())
        .then(json => setData(json))
        .catch(e => console.log(e.message));
    }
    setLoading(false);
  }, [userId]);

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
});
