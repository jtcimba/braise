import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTheme} from '../../theme/ThemeProvider';
import {Theme} from '../../theme/types';
import {LogBox} from 'react-native';

// Ignore WebView errors
LogBox.ignoreLogs(["Can't open url: about:srcdoc"]);

export default function RecipeViewer({data}: any) {
  const theme = useTheme() as unknown as Theme;
  const [isSimplified, setIsSimplified] = useState(false);
  const [webViewError, setWebViewError] = useState(false);

  const handleHostPress = () => {
    if (data.canonical_url) {
      Linking.openURL(data.canonical_url);
    }
  };

  return (
    <View style={{flex: 1}}>
      <View
        style={[
          styles(theme).toggleContainer,
          isSimplified && styles(theme).toggleContainerShadow,
        ]}>
        <Text style={styles(theme).toggleLabel}>Original</Text>
        <Switch
          value={isSimplified}
          onValueChange={setIsSimplified}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={theme.colors.background}
        />
        <Text style={styles(theme).toggleLabel}>Simplified</Text>
      </View>
      <View
        style={[
          styles(theme).contentContainer,
          isSimplified && styles(theme).hidden,
        ]}>
        {webViewError ? (
          <View style={styles(theme).errorContainer}>
            <Text style={styles(theme).errorText}>
              Unable to load the recipe. Please try again later.
            </Text>
            <TouchableOpacity
              style={styles(theme).retryButton}
              onPress={() => setWebViewError(false)}>
              <Text style={styles(theme).retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{uri: data.canonical_url}}
            style={styles(theme).webview}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={true}
            allowsInlineMediaPlayback={false}
            allowsFullscreenVideo={false}
            allowsPictureInPictureMediaPlayback={false}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setWebViewError(true);
            }}
            onHttpError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
              setWebViewError(true);
            }}
            onShouldStartLoadWithRequest={request => {
              if (
                request.url.includes('video') ||
                request.url.includes('player')
              ) {
                return false;
              }
              return true;
            }}
          />
        )}
      </View>
      <View
        style={[
          styles(theme).contentContainer,
          !isSimplified && styles(theme).hidden,
        ]}>
        <ScrollView automaticallyAdjustKeyboardInsets={true}>
          <Image
            style={styles(theme).image}
            source={{uri: data.image ? data.image : null}}
          />
          <View style={styles(theme).bodyContainer}>
            <Text style={styles(theme).title}>{data.title}</Text>
            <View style={styles(theme).subheader}>
              <View style={styles(theme).itemBody}>
                <Text style={styles(theme).subtext}>{data.author}</Text>
                {data.host && <Text style={styles(theme).dot}>•</Text>}
                {data.host && (
                  <TouchableOpacity onPress={handleHostPress}>
                    <Text style={[styles(theme).subtext, styles(theme).host]}>
                      {data.host}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles(theme).subheader}>
              <Text
                style={[
                  styles(theme).time,
                  data.total_time ? styles(theme).paddingRight : null,
                ]}>
                {data.total_time}
              </Text>
              <Text style={styles(theme).subtext}>{data.yields}</Text>
            </View>
            {data.ingredients && (
              <>
                <Text style={styles(theme).sectionTitle}>Ingredients</Text>
                <View style={styles(theme).ingredientsContainer}>
                  <Text
                    style={[
                      styles(theme).lineText,
                      styles(theme).lineContainer,
                    ]}>
                    {data.ingredients}
                  </Text>
                </View>
              </>
            )}
            {data.instructions && (
              <>
                <Text style={styles(theme).sectionTitle}>Instructions</Text>
                <View style={styles(theme).instructionsContainer}>
                  {data.instructions
                    .split('\n')
                    .map((instruction: any, index: any) => {
                      return (
                        <View style={styles(theme).lineContainer} key={index}>
                          <Text style={styles(theme).lineNumber}>
                            {index + 1}.
                          </Text>
                          <Text style={styles(theme).lineText}>
                            {instruction}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 6,
      backgroundColor: theme.colors.background,
      position: 'absolute',
      top: 59,
      left: '50%',
      transform: [{translateX: -100}],
      width: 210,
      zIndex: 1,
      borderRadius: 25,
    },
    toggleContainerShadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    toggleLabel: {
      color: theme.colors.text,
      marginHorizontal: 8,
      fontSize: 12,
      flex: 1,
      textAlign: 'center',
    },
    image: {
      width: '100%',
      height: 350,
      resizeMode: 'cover',
      backgroundColor: theme.colors.border,
    },
    bodyContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      marginTop: 10,
      width: '100%',
      color: theme.colors.text,
    },
    subheader: {
      flexDirection: 'row',
      alignContent: 'center',
      marginTop: 5,
      width: '100%',
    },
    dot: {
      marginHorizontal: 5,
    },
    itemBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subtext: {
      fontSize: 16,
      color: theme.colors.subtext,
    },
    host: {
      textDecorationLine: 'underline',
    },
    time: {
      fontSize: 16,
      color: theme.colors.subtext,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      marginTop: 25,
      color: theme.colors.subtext,
    },
    instructionsContainer: {
      flex: 1,
      marginBottom: 25,
    },
    ingredientsContainer: {
      flex: 1,
    },
    lineContainer: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 5,
    },
    lineNumber: {
      lineHeight: 30,
      marginRight: 10,
      color: theme.colors.subtext,
    },
    lineText: {
      lineHeight: 30,
      flex: 1,
      alignSelf: 'flex-start',
      color: theme.colors.text,
    },
    paddingRight: {
      paddingRight: 5,
    },
    webview: {
      flex: 1,
      marginTop: 105,
    },
    contentContainer: {
      flex: 1,
    },
    hidden: {
      display: 'none',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: 5,
    },
    retryButtonText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
