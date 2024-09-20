import React, {useRef, useState, useEffect} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

interface InstructionsEditorProps {
  instructions: string;
}

const InstructionsEditor: React.FC<InstructionsEditorProps> = ({
  instructions,
}) => {
  const [text, setText] = useState(instructions.replace(/\\n/g, '\n'));
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const latestNonBackspaceKeyPressMsRef = useRef<number | null>(null);

  useEffect(() => {
    setText(instructions.replace(/\\n/g, '\n'));
  }, [instructions]);

  const handleLineChange = (newLine: string, index: number) => {
    console.log('line change', index);
    const lines = text.split('\n');

    if (newLine.includes('\n')) {
      const newLines = newLine.split('\n');
      lines[index] = newLines[0];
      lines.splice(index + 1, 0, newLines[1]);
      const newText = lines.join('\n');
      setText(newText);
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.setSelection(0, 0);
      return;
    }

    lines[index] = newLine;
    setText(lines.join('\n'));
  };

  const handleKeyPress = (e: any, index: number) => {
    const lines = text.split('\n');
    const currentLine = lines[index];

    if (
      e.nativeEvent.key === 'Backspace' &&
      index > 0 &&
      (!latestNonBackspaceKeyPressMsRef.current ||
        Date.now() - latestNonBackspaceKeyPressMsRef.current > 80) &&
      currentLine === ''
    ) {
      e.preventDefault();
      const previousLine = lines[index - 1];
      const prevLength = previousLine.length;
      const newLine = previousLine + currentLine;
      lines[index - 1] = newLine;
      lines.splice(index, 1);
      const newText = lines.join('\n');
      setText(newText);
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.setSelection(prevLength, prevLength);
      }, 0);
    } else {
      latestNonBackspaceKeyPressMsRef.current = Date.now();
    }
  };

  return (
    <View>
      <ScrollView ref={scrollViewRef}>
        {text.split('\n').map((line, index) => (
          <View key={index} style={styles.lineContainer}>
            <Text style={styles.lineNumber}>{index + 1}.</Text>
            <TextInput
              ref={(ref: any) => (inputRefs.current[index] = ref)}
              style={styles.lineText}
              value={line}
              onChangeText={newLine => handleLineChange(newLine, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              multiline
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  lineContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
  },
  lineNumber: {
    lineHeight: 30,
    marginRight: 10,
    color: '#666',
    paddingTop: 5,
  },
  lineText: {
    lineHeight: 30,
    flex: 1,
  },
});

export default InstructionsEditor;
