import type { LanguagePlugin } from './index';

const YamlPlugin: LanguagePlugin = {
  language: 'yaml',
  load: async () => {
    try {
      // 注: モジュールのパスは環境に応じて変更が必要かもしれません
      if (typeof window !== 'undefined' && window.monaco) {
        // すでにMonacoがロードされている場合は追加設定のみ行う
        return;
      }
      
      // monaco-yamlパッケージをロード（存在する場合）
      try {
        const monacoYaml = await import('monaco-yaml');
        // monaco-yamlが正常にロードされた場合は、後続の設定で適用される
      } catch (err) {
        console.warn('monaco-yamlパッケージが見つかりません。基本的なYAML構文ハイライトのみが利用可能です。');
      }
    } catch (error) {
      console.error('YAML言語サポートのロード中にエラーが発生しました:', error);
    }
  },
  configure: (monaco) => {
    // monaco-yamlがロードされている場合、YAMLの診断オプションを設定
    if (monaco.languages.yaml && monaco.languages.yaml.yamlDefaults) {
      monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
        validate: true,
        enableSchemaRequest: true,
        hover: true,
        completion: true,
        format: true
      });
    }
  }
};

export default YamlPlugin; 