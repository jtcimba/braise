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
import {Slider} from '@miblanchard/react-native-slider';
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

  function renderDuration() {
    if (viewMode === 'view') {
      return (
        <Text style={total_time ? styles.duration : null}>
          {total_time ? total_time + ' min' : null}
        </Text>
      );
    } else {
      return (
        <View>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationContainer}>
            <View style={styles.slider}>
              <Slider
                minimumValue={0}
                maximumValue={240}
                step={1}
                value={editingData.total_time?.toString()}
                onValueChange={text =>
                  onChangeEditingData({...editingData, total_time: text})
                }
              />
            </View>
            <Text style={styles.sliderValue}>
              {editingData.total_time?.toString()}
              {editingData.total_time ? (
                <Text style={styles.subtext}> min</Text>
              ) : null}
            </Text>
          </View>
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
            style={styles.subtext}
            value={editingData.yields}
            multiline={true}
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
          <View style={styles.itemContainer} key={index}>
            <Text>{ingredient}</Text>
          </View>
        );
      });
    } else {
      return (
        <TextInput
          style={styles.editText}
          value={editingData.ingredients}
          placeholder="Enter ingredients, one per line"
          onChangeText={(text: any) => {
            console.log(text);
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
          <View style={styles.itemContainer} key={index}>
            <Text style={styles.instructionCount}>{index + 1}.</Text>
            <Text style={styles.instructionItem}>{instruction}</Text>
          </View>
        );
      });
    } else {
      const instructionsArray = instructions.split('\\n').map((item: any) => {
        return {text: item, id: Math.random()};
      });
      return <InstructionsEditor instructionsArray={instructionsArray} />;
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
                {renderDuration()}
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
  duration: {
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
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 25,
    color: '#666',
  },
  instructionItem: {
    lineHeight: 30,
    flex: 1,
  },
  instructionCount: {
    lineHeight: 30,
    marginRight: 10,
    color: '#666',
  },
  instructionsContainer: {
    flex: 1,
    paddingBottom: 25,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    textAlign: 'center',
    marginTop: 10,
    marginLeft: 10,
    width: 55,
  },
  durationContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  editSubHeader: {
    flexDirection: 'column',
    width: '100%',
  },
  editText: {
    alignSelf: 'flex-start',
    lineHeight: 30,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineNumber: {
    marginRight: 4,
  },
});
