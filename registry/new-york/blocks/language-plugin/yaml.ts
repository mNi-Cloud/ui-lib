import type { LanguagePlugin } from './index';
import * as yaml from 'yaml';

const YamlPlugin: LanguagePlugin = {
  language: 'yaml',
  
  load: async () => {
    return Promise.resolve();
  },
  
  configure: (monaco: any) => {
    try {
      const yamlDiagnosticsOwner = 'yaml-validator';
      
      const validateYaml = (code: string, model: any) => {
        monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, []);
        
        if (!code.trim()) return;
        
        try {
          yaml.parse(code);
        } catch (error: any) {
          if (error.linePos && error.linePos.start) {
            const { line, col } = error.linePos.start;
            const startLineNumber = line;
            const startColumn = col;
            const endLineNumber = error.linePos.end?.line || startLineNumber;
            const endColumn = error.linePos.end?.col || (startColumn + 1);
            
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: error.message || 'YAML syntax error',
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn
            }]);
          } else {
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: error.message || 'YAML syntax error',
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 2
            }]);
          }
        }
      };
      
      const setupModelChangeListener = (model: any) => {
        if (model.getLanguageId() === 'yaml') {
          validateYaml(model.getValue(), model);
          
          model.onDidChangeContent(() => {
            validateYaml(model.getValue(), model);
          });
        }
      };
      
      monaco.editor.getModels().forEach(setupModelChangeListener);
      
      monaco.editor.onDidCreateModel(setupModelChangeListener);
      
    } catch (error) {
      console.error('Error configuring YAML:', error);
    }
  }
};

export default YamlPlugin;