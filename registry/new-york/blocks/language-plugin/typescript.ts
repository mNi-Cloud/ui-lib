import type { LanguagePlugin } from './index';

const TypeScriptPlugin: LanguagePlugin = {
  language: 'typescript',
  load: async () => {
    try {
      if (typeof window !== 'undefined' && window.monaco) {
        return;
      }
    } catch (error) {
      console.error('Error loading TypeScript language support:', error);
    }
  },
  configure: (monaco) => {
    if (monaco.languages.typescript) {
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        lib: ['es2020', 'dom'],
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
      });
    }
  }
};

export default TypeScriptPlugin; 