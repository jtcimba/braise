import React, {useEffect, useRef, useState} from 'react';
import InstructionItem from './InstructionItem';
import {View} from 'react-native';

const InstructionsEditor = ({
  instructionsArray,
}: {
  instructionsArray: any[];
}) => {
  const [instructions, setInstructions] = useState(instructionsArray);
  const [cursorPosition, setCursorPosition] = useState<{
    index: any;
    selection: any;
  }>({
    index: null,
    selection: null,
  });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const editItem = (
    type: string,
    i: number,
    curText?: string,
    newText?: string,
  ) => {
    const newInstructions = [...instructions];
    if (type === 'newline') {
      newInstructions[i] = {text: curText, id: Math.random()};
      newInstructions.splice(i + 1, 0, {text: newText, id: Math.random()});
      setCursorPosition({index: i + 1, selection: 0});
    } else if (type === 'backspace') {
      const prevLength = newInstructions[i - 1].text.length;
      newInstructions[i - 1].text = instructions[i - 1].text + curText;
      newInstructions.splice(i, 1);
      setCursorPosition({
        index: i - 1,
        selection: prevLength,
      });
    }
    setInstructions(newInstructions);
  };

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, instructions.length);
  }, [instructions]);

  useEffect(() => {
    if (
      cursorPosition.index !== null &&
      cursorPosition.selection !== null &&
      inputRefs.current[cursorPosition.index]
    ) {
      // @ts-ignore
      inputRefs.current[cursorPosition.index]?.focus();
      // @ts-ignore
      inputRefs.current[cursorPosition.index]?.setSelection(
        cursorPosition.selection,
        cursorPosition.selection,
      );
      setCursorPosition({index: null, selection: null});
    }
  }, [cursorPosition]);

  return (
    <View>
      {instructions.map((value, index) => (
        <InstructionItem
          key={value.id}
          innerRef={(ref: any) => (inputRefs.current[index] = ref)}
          instruction={value.text}
          i={index}
          onSubmit={(type, i, curText, newText) =>
            editItem(type, i, curText, newText)
          }
        />
      ))}
    </View>
  );
};

export default InstructionsEditor;
