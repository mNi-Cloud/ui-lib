import type { LanguagePlugin } from './index';

const TypeScriptPlugin: LanguagePlugin = {
  language: 'typescript',
  load: async () => {
    try {
      // 注: モジュールのパスは環境に応じて変更が必要かもしれません
      if (typeof window !== 'undefined' && window.monaco) {
        // すでにMonacoがロードされている場合は追加設定のみ行う
        return;
      }
    } catch (error) {
      console.error('TypeScript言語サポートのロード中にエラーが発生しました:', error);
    }
  },
  configure: (monaco) => {
    // TypeScriptのフォーマットオプションを設定
    if (monaco.languages.typescript) {
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
      // TypeScriptのコンパイルオプションを設定
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        lib: ['es2020', 'dom'],
        // TypeScript固有の設定
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
      });
    }
  }
};

export default TypeScriptPlugin; 