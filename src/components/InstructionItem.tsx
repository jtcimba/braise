import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TextInput} from 'react-native';

interface InstructionItemProps {
  instruction: string;
  i: any;
  onSubmit: (
    type: string,
    i: number,
    curText?: string,
    newText?: string,
    ref?: any,
  ) => void;
  innerRef: any;
}

const InstructionItem = ({
  instruction,
  i,
  onSubmit,
  innerRef,
}: InstructionItemProps) => {
  const [text, setText] = useState('');
  const [selection, setSelection] = useState({start: 0, end: 0});
  const [initialState, setInitialState] = useState(true);

  useEffect(() => {
    if (!instruction) {
      return;
    }

    setText(instruction);
  }, [instruction]);

  useEffect(() => {
    if (innerRef.current) {
      innerRef?.current?.focus();
    }
  }, [innerRef]);

  const onSubmitEdit = () => {
    const curText = text.slice(0, selection.start);
    const newText = text.slice(selection.end);
    onSubmit('newline', i, curText, newText);
  };

  const onKeyPress = (e: any) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      i > 0 &&
      selection.start === 0 &&
      selection.end === 0
    ) {
      onSubmit('backspace', i, text);
    }
  };

  const handleSelectionChange = (e: any) => {
    if (initialState) {
      setInitialState(false);
      return;
    }
    setSelection(e.nativeEvent.selection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructionCount}>{i + 1}.</Text>
      <TextInput
        ref={innerRef}
        style={styles.itemText}
        value={text}
        onChangeText={setText}
        multiline
        onSubmitEditing={onSubmitEdit}
        onKeyPress={onKeyPress}
        blurOnSubmit
        onSelectionChange={(e: any) => {
          handleSelectionChange(e);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  itemText: {
    alignSelf: 'flex-start',
    lineHeight: 30,
    flex: 1,
  },
  instructionCount: {
    lineHeight: 30,
    marginRight: 10,
    paddingVertical: 5,
    color: '#666',
  },
});

export default InstructionItem;
