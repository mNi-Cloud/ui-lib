import type { LanguagePlugin } from './index';

const JsonPlugin: LanguagePlugin = {
  language: 'json',
  load: async () => {
    try {
      // 注: モジュールのパスは環境に応じて変更が必要かもしれません
      if (typeof window !== 'undefined' && window.monaco) {
        // すでにMonacoがロードされている場合は追加設定のみ行う
        return;
      }
    } catch (error) {
      console.error('JSON言語サポートのロード中にエラーが発生しました:', error);
    }
  },
  configure: (monaco) => {
    // JSONのフォーマットオプションを設定
    if (monaco.languages.json) {
      // JSONスキーマの設定など
      try {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: true,
          schemas: [],
          enableSchemaRequest: true
        });
      } catch (error) {
        console.error('JSON言語設定中にエラーが発生しました:', error);
      }
    }
  }
};

export default JsonPlugin; 