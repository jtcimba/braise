import {Platform, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const isTablet = (): boolean =>
  Platform.OS === 'ios' && !!(Platform as any).isPad;

export const MAX_CONTENT_WIDTH = 560;
export const MODAL_MAX_WIDTH = 480;

export const useHeaderStatusBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const minTabletInset = isTablet() ? (isLandscape ? 32 : 20) : 0;
  return Math.max(insets.top, minTabletInset);
};
