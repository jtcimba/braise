import React, {useEffect, useRef} from 'react';
import {Text, View, StyleSheet, Image, Pressable, Animated} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useAppDispatch, useAppSelector} from '../hooks';
import {changeViewMode} from '../features/viewModeSlice';
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
  const instructionsList = instructions.toString().split('\\n');
  const [editingData, onChangeEditingData] = React.useState(route.params.item);
  const yOffset = useRef(new Animated.Value(0)).current;
  const headerOpacity = yOffset.interpolate({
    inputRange: [0, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    dispatch(changeViewMode('view'));
  }, [dispatch]);

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
        <TextInput
          style={total_time ? styles.duration : null}
          value={editingData.total_time?.toString()}
          multiline={true}
          placeholder="Duration"
          keyboardType="numeric"
          onChangeText={text =>
            onChangeEditingData({...editingData, total_time: text})
          }
        />
      );
    }
  }

  function renderYields() {
    if (viewMode === 'view') {
      return <Text style={styles.subtext}>{yields}</Text>;
    } else {
      return (
        <TextInput
          style={styles.subtext}
          value={editingData.yields}
          multiline={true}
          placeholder="Yields"
          onChangeText={text =>
            onChangeEditingData({...editingData, yields: text})
          }
        />
      );
    }
  }

  function renderIngredients() {
    return ingredients.map((ingredient: any, index: any) => {
      return (
        <View style={styles.itemContainer} key={index}>
          <Text>{ingredient}</Text>
        </View>
      );
    });
  }

  function renderInstructions() {
    return instructionsList.map((instruction: any, index: any) => {
      return (
        <View style={styles.itemContainer} key={index}>
          <Text style={styles.instructionCount}>{index + 1}.</Text>
          <Text style={styles.instructionItem}>{instruction}</Text>
        </View>
      );
    });
  }

  return (
    <Animated.ScrollView
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
          <View style={styles.container}>
            {renderTitle()}
            <View style={styles.subheader}>
              <View style={styles.itemBody}>
                <Text style={styles.subtext}>{author}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.subtext}>{host}</Text>
              </View>
            </View>
            <View style={styles.subheader}>
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
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingRight: 10,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  subheader: {
    flexDirection: 'row',
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
    marginBottom: 15,
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
});
