import React, {useRef} from 'react';
import {Animated, TouchableWithoutFeedback} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TabBarIconProps {
  name: string;
  color?: string;
  size?: number;
  onPressFunction: () => void;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  color = 'gray',
  size = 25,
  onPressFunction,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const icons: {[key: string]: string} = {
    Recipes: 'file-tray-full-outline',
    Discover: 'compass-outline',
    Add: 'add-circle-outline',
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

  return (
    <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{transform: [{scale}]}}>
        <Ionicons name={icons[name]} size={size} color={color} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default TabBarIcon;
