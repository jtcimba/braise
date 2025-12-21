import {useTheme} from '../../theme/ThemeProvider';
import React, {useRef, forwardRef} from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Theme} from '../../theme/types';

interface TabBarIconProps {
  name: string;
  color?: string;
  size?: number;
  onPressFunction: () => void;
}

const TabBarIcon = forwardRef<any, TabBarIconProps>(
  ({name, color = 'gray', size = 22, onPressFunction}, ref) => {
    const scale = useRef(new Animated.Value(1)).current;

    const icons: {[key: string]: string} = {
      Recipes: 'file-tray-full-outline',
      'Grocery List': 'cart-outline',
      Add: 'add-circle-outline',
    };

    const labels: {[key: string]: string} = {
      Recipes: 'Recipes',
      'Grocery List': 'Shopping List',
      Add: 'Add New',
    };

    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }).start();
      onPressFunction();
    };

    const theme = useTheme() as unknown as Theme;

    return (
      <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View
          ref={ref}
          style={[styles(theme).container, {transform: [{scale}]}]}>
          <Ionicons name={icons[name]} size={size} color={color} />
          <Text style={[styles(theme).label, {color}]}>{labels[name]}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  },
);

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    label: {
      ...theme.typography.h6,
    },
  });

export default TabBarIcon;
