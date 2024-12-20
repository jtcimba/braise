import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useTheme, useNavigation, ParamListBase} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

export default function AddScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const {colors} = useTheme();

  return (
    <View style={styles(colors).content}>
      <TouchableOpacity
        onPress={() => navigation.navigate('AddFromUrl')}
        style={styles(colors).button}>
        <Text style={styles(colors).text}>From url</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => console.log('From scratch')}
        style={styles(colors).button}>
        <Text style={styles(colors).text}>From scratch</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    content: {
      padding: 22,
      alignItems: 'center',
      height: '100%',
    },
    button: {
      backgroundColor: 'lightgray',
      padding: 15,
      marginVertical: 10,
      borderRadius: 10,
      width: '100%',
    },
    text: {
      color: colors.text,
      fontSize: 16,
    },
  });
