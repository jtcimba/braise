import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';

export default function Item({item, navigation}: any) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('RecipeDetailsScreen', {item: item})}>
      <View>
        <Image
          style={styles.image}
          source={{
            uri: item.image ? item.image : null,
          }}
        />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtext}>{item.author}</Text>
        <Text style={styles.time}>{item.total_time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
});
