import type { LanguagePlugin } from './index';
import type { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

const JsonPlugin: LanguagePlugin = {
  language: 'json',
  load: async () => {
    try {
      if (typeof window !== 'undefined' && window.monaco) {
        return;
      }
    } catch (error) {
      console.error('Error loading JSON language support:', error);
    }
  },
  configure: (monaco: Monaco) => {
    if (monaco.languages.json) {
      try {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: true,
          schemas: [],
          enableSchemaRequest: true
        });
      } catch (error) {
        console.error('Error configuring JSON language:', error);
      }
    }
  }
};

export default JsonPlugin; 