import React, {useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CoreBridge,
  ListItemBridge,
  OrderedListBridge,
  RichText,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {LogBox} from 'react-native';
import {useTheme} from '../../theme/ThemeProvider';

// Ignore specific WebView errors
LogBox.ignoreLogs(["Editor isn't ready yet", "Can't open url: about:srcdoc"]);

export default function InstructionsEditor({
  instructions,
  handleInstructionsUpdate,
  handleModalClose,
  modalVisible,
}: any) {
  const theme = useTheme() as unknown as any;

  const convertInstructionsToHtml = (i: string) => {
    if (!i) {
      return '<ol><li></li></ol>';
    }
    let html = '<ol>';
    i.split('\n').forEach(i => {
      html += `<li>${i}</li>`;
    });
    html += '</ol>';
    return html;
  };

  const convertInstructionsToList = (i: string) => {
    return i
      .replace(/<ol>/g, '')
      .replace(/<\/ol>/g, '')
      .replace(/<li>/g, '')
      .replace(/<\/li>/g, '\n')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '')
      .trimEnd();
  };

  const customCodeBlockCSS = `      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        font-size: 1rem;
        background-color: #F6F6F4;
        color: #2D2D2D;
        line-height: 1.5;
      }
    `;

  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent: convertInstructionsToHtml(instructions),
    bridgeExtensions: [
      ListItemBridge,
      OrderedListBridge,
      CoreBridge.configureCSS(customCodeBlockCSS),
    ],
  });

  const content = useEditorContent(editor, {type: 'html'});

  useEffect(() => {
    content && handleInstructionsUpdate(convertInstructionsToList(content));
  }, [content, handleInstructionsUpdate]);

  return (
    <Modal
      isVisible={modalVisible}
      onBackdropPress={() => handleModalClose()}
      onSwipeComplete={() => handleModalClose()}
      style={styles(theme).modalContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles(theme).keyboardAvoidingView}>
        <SafeAreaView style={styles(theme).safeAreaView}>
          <View style={styles(theme).headerContainer}>
            <Text style={styles(theme).headerText}>Edit Directions</Text>
            <TouchableOpacity
              style={styles(theme).iconContainer}
              onPress={() => handleModalClose()}>
              <Ionicons
                name="close-outline"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
          <RichText editor={editor} style={styles(theme).editor} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    editor: {
      backgroundColor: 'transparent',
    },
    modalContainer: {
      margin: 0,
    },
    safeAreaView: {
      flex: 1,
      backgroundColor: theme.colors.background,
      marginTop: 20,
      marginHorizontal: 30,
    },
    optionsText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    iconContainer: {
      borderRadius: 48,
      padding: 2,
    },
    closeContainer: {
      alignSelf: 'flex-end',
      paddingBottom: 10,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    headerText: {
      color: theme.colors.text,
      ...theme.typography.h2,
    },
  });
