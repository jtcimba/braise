const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.resolve(__dirname, '.env.local'))
  ? '.env.local'
  : '.env';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {path: envPath}],
    'react-native-reanimated/plugin',
  ],
};
