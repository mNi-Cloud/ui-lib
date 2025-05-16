import type { LanguagePlugin } from './index';

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
  configure: (monaco) => {
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