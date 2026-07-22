module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // headerLeft/headerTitle/tabBarIcon etc. are navigation props, not render children
    'react/no-unstable-nested-components': ['warn', {allowAsProps: true}],
  },
};
