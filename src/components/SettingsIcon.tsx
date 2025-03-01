import React from 'react';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';

function SettingsIcon(navigation: any) {
  const theme = useTheme() as unknown as Theme;

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
      <Ionicons
        name="settings-outline"
        size={24}
        color={theme.colors.subtext}
      />
    </TouchableOpacity>
  );
}

export default SettingsIcon;
