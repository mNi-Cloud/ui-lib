import type { LanguagePlugin } from './index';

const YamlPlugin: LanguagePlugin = {
  language: 'yaml',
  load: async () => {
    try {
      // 注: モジュールのパスは環境に応じて変更が必要かもしれません
      if (typeof window !== 'undefined' && window.monaco) {
        // すでにMonacoがロードされている場合でも初期化を行う
        try {
          const monacoYaml = await import('monaco-yaml');
          // monaco-yamlライブラリを初期化
          monacoYaml.configureMonacoYaml(window.monaco, {
            validate: true,
            enableSchemaRequest: true,
            hover: true,
            completion: true,
            format: true,
            // YAMLのバリデーションを強化
            schemas: [],
          });
        } catch (err) {
          console.warn('monaco-yamlパッケージが見つかりません。基本的なYAML構文ハイライトのみが利用可能です。', err);
        }
        return;
      }
      
      // monaco-yamlパッケージをロード（存在する場合）
      try {
        await import('monaco-yaml');
        // monaco-yamlが正常にロードされた場合は、モナコエディタがロードされたときに
        // configure関数で初期化される
      } catch (err) {
        console.warn('monaco-yamlパッケージが見つかりません。基本的なYAML構文ハイライトのみが利用可能です。', err);
      }
    } catch (error) {
      console.error('YAML言語サポートのロード中にエラーが発生しました:', error);
    }
  },
  configure: (monaco) => {
    try {
      // monaco-yamlを初期化
      import('monaco-yaml').then((monacoYaml) => {
        // YAMLサポートをモナコエディタに追加
        monacoYaml.configureMonacoYaml(monaco, {
          validate: true,
          enableSchemaRequest: true,
          hover: true,
          completion: true,
          format: true,
          // YAMLのバリデーションを強化
          schemas: [],
        });
      }).catch(err => {
        console.warn('YAMLサポートの初期化中にエラーが発生しました:', err);
      });
    } catch (error) {
      console.error('YAML設定中にエラーが発生しました:', error);
    }
  }
};

export default YamlPlugin; 