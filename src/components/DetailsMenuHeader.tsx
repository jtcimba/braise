import React from 'react';
import {useRoute} from '@react-navigation/native';
import DetailsMenu from './DetailsMenu';
import {RecipeIngredient} from '../models';

interface DetailsMenuHeaderProps {
  navigation: any;
  structuredIngredients?: RecipeIngredient[];
}

export default function DetailsMenuHeader({
  navigation,
  structuredIngredients = [],
}: DetailsMenuHeaderProps) {
  const route = useRoute();
  const routeData = (route.params as any)?.item || {};

  return (
    <DetailsMenu
      navigation={navigation}
      structuredIngredients={structuredIngredients}
      routeData={routeData}
    />
  );
}
