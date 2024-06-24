import {DrawerActions} from '@react-navigation/native';
import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function SettingsIcon(navigation: any) {
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
      <Ionicons name="settings-outline" size={25} color="gray" />
    </TouchableOpacity>
  );
}

export default SettingsIcon;
