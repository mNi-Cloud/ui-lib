import type { LanguagePlugin } from './index';

const JavaScriptPlugin: LanguagePlugin = {
  language: 'javascript',
  load: async () => {
    try {
      if (typeof window !== 'undefined' && window.monaco) {
        return;
      }
    } catch (error) {
      console.error('Error loading JavaScript language support:', error);
    }
  },
  configure: (monaco) => {
    if (monaco.languages.typescript) {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
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