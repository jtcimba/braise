/****
 * @format
 */
import React from 'react';
import 'react-native-gesture-handler';
import {AppRegistry, AppState} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {Provider} from 'react-redux';
import store from './src/redux/store';
import {EditingHandlerProvider} from './src/context/EditingHandlerContext';
import {Linking} from 'react-native';

function useAppForeground(callback) {
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    let isMounted = true;

    const invoke = () => {
      if (isMounted) {
        callback();
      }
    };

    invoke();

    const handleChange = nextAppState => {
      const wasBackground =
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active';

      appState.current = nextAppState;

      if (wasBackground) {
        invoke();
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [callback]);
}

export default function RootApp() {
  const [pendingDeepLink, setPendingDeepLink] = React.useState(null);
  const lastProcessedUrlRef = React.useRef(null);

  const processDeepLinkUrl = React.useCallback(
    (url, {force = false} = {}) => {
      if (!url) {
        return;
      }

      if (!force && lastProcessedUrlRef.current === url) {
        return;
      }

      lastProcessedUrlRef.current = url;
      setPendingDeepLink({url});
    },
    [setPendingDeepLink],
  );

  const handleDeepLink = React.useCallback(
    event => {
      processDeepLinkUrl(event?.url, {force: true});
    },
    [processDeepLinkUrl],
  );

  const consumeDeepLink = React.useCallback(() => {
    setPendingDeepLink(null);
  }, [setPendingDeepLink]);

  useAppForeground(
    React.useCallback(() => {
      Linking.getInitialURL().then(url => {
        processDeepLinkUrl(url);
      });
    }, [processDeepLinkUrl]),
  );

  React.useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return (
    <Provider store={store}>
      <EditingHandlerProvider>
        <App
          pendingDeepLink={pendingDeepLink}
          onConsumeDeepLink={consumeDeepLink}
        />
      </EditingHandlerProvider>
    </Provider>
  );
}

AppRegistry.registerComponent(appName, () => RootApp);
