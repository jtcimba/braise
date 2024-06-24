import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function BackIcon(navigation: any) {
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="chevron-back-outline" size={25} color="gray" />
    </TouchableOpacity>
  );
}

export default BackIcon;
