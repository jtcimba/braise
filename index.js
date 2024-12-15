/**
 * @format
 */
import React from 'react';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {Amplify} from 'aws-amplify';
import amplifyconfig from './src/amplifyconfiguration.json';
import {Provider} from 'react-redux';
import store from './src/redux/store';
import {EditingHandlerProvider} from './src/context/EditingHandlerContext';
Amplify.configure(amplifyconfig);

const ReduxProvider = () => (
  <Provider store={store}>
    <EditingHandlerProvider>
      <App />
    </EditingHandlerProvider>
  </Provider>
);

AppRegistry.registerComponent(appName, () => ReduxProvider);
