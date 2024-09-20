import React, {useEffect, useRef, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useAppDispatch, useAppSelector} from '../hooks';
import {changeViewMode} from '../features/viewModeSlice';
import InstructionsEditor from './InstructionsEditor';

export default function DetailsScreen({route, navigation}: any) {
  const {
    title,
    total_time,
    image,
    yields,
    host,
    author,
    ingredients,
    instructions,
  } = route.params.item;

  const viewMode = useAppSelector(state => state.viewMode.value);
  const dispatch = useAppDispatch();
  const [editingData, onChangeEditingData] = useState({
    ...route.params.item,
    ingredients: route.params.item.ingredients.join('\n'),
  });
  const yOffset = useRef(new Animated.Value(0)).current;
  const headerOpacity = yOffset.interpolate({
    inputRange: [0, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    dispatch(changeViewMode('edit'));
  }, [dispatch, route.params.item]);

  useEffect(() => {
    onChangeEditingData({
      ...route.params.item,
      ingredients: route.params.item.ingredients.join('\n'),
    });
  }, [viewMode, route.params.item]);

  useEffect(() => {
    function headerBackground() {
      return (
        <Animated.View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            backgroundColor: '#EBE9E5',
            ...StyleSheet.absoluteFillObject,
            opacity: headerOpacity,
          }}
        />
      );
    }

    navigation.setOptions({
      headerStyle: {
        backgroundColor: headerOpacity,
      },
      headerBackground: () => headerBackground(),
      headerTransparent: true,
    });
  }, [headerOpacity, navigation]);

  function onEdit() {
    dispatch(changeViewMode('edit'));
  }

  function renderImage() {
    if (viewMode === 'view') {
      return <Image style={styles.image} source={{uri: image}} />;
    } else {
      return <Image style={styles.image} source={{uri: image}} />;
    }
  }

  function renderTitle() {
    if (viewMode === 'view') {
      return <Text style={styles.title}>{title}</Text>;
    } else {
      return (
        <TextInput
          style={styles.title}
          value={editingData.title}
          multiline={true}
          placeholder="Recipe name"
          onChangeText={text =>
            onChangeEditingData({...editingData, title: text})
          }
        />
      );
    }
  }

  function renderTime() {
    if (viewMode === 'view') {
      return <Text style={styles.time}>{total_time}</Text>;
    } else {
      return (
        <View>
          <Text style={styles.sectionTitle}>Total Time</Text>
          <TextInput
            style={styles.lineText}
            value={editingData.total_time}
            placeholder="Time to cook"
            onChangeText={text =>
              onChangeEditingData({...editingData, total_time: text})
            }
          />
        </View>
      );
    }
  }

  function renderYields() {
    if (viewMode === 'view') {
      return <Text style={styles.subtext}>{yields}</Text>;
    } else {
      return (
        <View>
          <Text style={styles.sectionTitle}>Servings</Text>
          <TextInput
            style={styles.lineText}
            value={editingData.yields}
            placeholder="Yields"
            onChangeText={text =>
              onChangeEditingData({...editingData, yields: text})
            }
          />
        </View>
      );
    }
  }

  function renderIngredients() {
    if (viewMode === 'view') {
      return ingredients.map((ingredient: any, index: any) => {
        return (
          <View style={styles.lineContainer} key={index}>
            <Text>{ingredient}</Text>
          </View>
        );
      });
    } else {
      return (
        <TextInput
          style={styles.lineText}
          value={editingData.ingredients}
          placeholder="Enter ingredients, one per line"
          onChangeText={(text: any) => {
            onChangeEditingData({
              ...editingData,
              ingredients: text,
            });
          }}
          multiline
        />
      );
    }
  }

  const renderInstructions = () => {
    if (viewMode === 'view') {
      return instructions.split('\\n').map((instruction: any, index: any) => {
        return (
          <View style={styles.lineContainer} key={index}>
            <Text style={styles.lineNumber}>{index + 1}.</Text>
            <Text style={styles.lineText}>{instruction}</Text>
          </View>
        );
      });
    } else {
      return <InstructionsEditor instructions={instructions} />;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Animated.ScrollView
        automaticallyAdjustKeyboardInsets={true}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: yOffset,
                },
              },
            },
          ],
          {useNativeDriver: true},
        )}>
        <Pressable onLongPress={onEdit}>
          <View>
            {renderImage()}
            <View style={styles.bodyContainer}>
              {renderTitle()}
              <View style={styles.subheader}>
                <View style={styles.itemBody}>
                  <Text style={styles.subtext}>{author}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.subtext}>{host}</Text>
                </View>
              </View>
              <View
                style={
                  viewMode === 'view' ? styles.subheader : styles.editSubHeader
                }>
                {renderTime()}
                {renderYields()}
              </View>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsContainer}>
                {renderIngredients()}
              </View>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <View style={styles.instructionsContainer}>
                {renderInstructions()}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  title: {
    fontSize: 20,
    marginTop: 10,
    width: '100%',
  },
  subtext: {
    color: '#666',
    overflow: 'hidden',
  },
  time: {
    color: '#666',
    overflow: 'hidden',
    paddingRight: 5,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
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
    color: '#666',
  },
  lineText: {
    lineHeight: 30,
    flex: 1,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 25,
    color: '#666',
  },
  instructionsContainer: {
    flex: 1,
    paddingBottom: 25,
  },
  editSubHeader: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
});
