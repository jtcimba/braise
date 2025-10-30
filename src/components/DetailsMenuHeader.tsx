import React from 'react';
import {useRoute} from '@react-navigation/native';
import DetailsMenu from './DetailsMenu';

interface DetailsMenuHeaderProps {
  navigation: any;
  scaledIngredients?: string;
}

export default function DetailsMenuHeader({
  navigation,
  scaledIngredients,
}: DetailsMenuHeaderProps) {
  const route = useRoute();
  const ingredients =
    scaledIngredients || (route.params as any)?.item?.ingredients || '';

  return <DetailsMenu navigation={navigation} ingredients={ingredients} />;
}
