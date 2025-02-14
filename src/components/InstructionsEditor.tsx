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

LogBox.ignoreLogs(["Editor isn't ready yet"]);

export default function InstructionsEditor({
  instructions,
  handleInstructionsUpdate,
  handleModalClose,
  modalVisible,
}: any) {
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
      style={styles.modalOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.fullScreen}>
        <SafeAreaView style={styles.modal}>
          <View style={[styles.optionsView, styles.borderBottom]}>
            <Text style={styles.optionsText}>Edit Instructions</Text>
            <View style={[styles.iconContainer]}>
              <TouchableOpacity onPress={() => handleModalClose()}>
                <Ionicons name="close-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <RichText editor={editor} style={styles.editor} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#EBE9E5',
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
    backgroundColor: '#EBE9E5',
    borderRadius: 25,
    paddingStart: 20,
    paddingEnd: 20,
  },
  optionsView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
    paddingBottom: 10,
  },
  optionsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 48,
    padding: 2,
  },
});
