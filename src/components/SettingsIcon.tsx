import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function SettingsIcon(navigation: any) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
      <Ionicons name="settings-outline" size={25} color="gray" />
    </TouchableOpacity>
  );
}

export default SettingsIcon;
