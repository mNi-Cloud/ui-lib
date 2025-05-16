import type { LanguagePlugin } from './index';

const JavaScriptPlugin: LanguagePlugin = {
  language: 'javascript',
  load: async () => {
    try {
      // 注: モジュールのパスは環境に応じて変更が必要かもしれません
      if (typeof window !== 'undefined' && window.monaco) {
        // すでにMonacoがロードされている場合は追加設定のみ行う
        return;
      }
    } catch (error) {
      console.error('JavaScript言語サポートのロード中にエラーが発生しました:', error);
    }
  },
  configure: (monaco) => {
    // JavaScriptのフォーマットオプションを設定
    if (monaco.languages.typescript) {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
      // JavaScriptのコンパイルオプションを設定
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        lib: ['es2020', 'dom'],
      });
    }
  }
};

export default JavaScriptPlugin; 