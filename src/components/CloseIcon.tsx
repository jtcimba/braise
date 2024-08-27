import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function CloseIcon(navigation: any) {
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="close-circle" size={25} color="gray" />
    </TouchableOpacity>
  );
}

export default CloseIcon;
