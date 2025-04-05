import React, {useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
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
  const theme = useTheme();

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
      font-family: Poppins-Regular, sans-serif;
      font-weight: normal;
      font-size: 0.875rem;
      background-color: rgba(0, 0, 0, 0);
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
      style={styles(theme).modalOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles(theme).fullScreen}>
        <SafeAreaView style={styles(theme).modal}>
          <View style={[styles(theme).closeContainer]}>
            <TouchableOpacity
              style={styles(theme).iconContainer}
              onPress={() => handleModalClose()}>
              <Ionicons name="close-outline" size={20} color="white" />
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
    fullScreen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
    },
    editor: {
      backgroundColor: 'transparent',
    },
    modalOverlay: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    modal: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 25,
      paddingStart: 20,
      paddingEnd: 20,
      marginTop: 20,
      marginBottom: 20,
    },
    optionsText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    iconContainer: {
      backgroundColor: theme.colors.opaque,
      borderRadius: 48,
      padding: 2,
    },
    closeContainer: {
      alignSelf: 'flex-end',
      paddingBottom: 10,
    },
  });
