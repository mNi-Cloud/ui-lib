import type { LanguagePlugin } from './index';
import * as yaml from 'yaml';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface YamlError extends Error {
  linePos?: {
    start?: { line: number; col: number };
    end?: { line: number; col: number };
  };
  message: string;
}

const YamlPlugin: LanguagePlugin = {
  language: 'yaml',
  
  load: async () => {
    return Promise.resolve();
  },
  
  configure: (monaco: Monaco) => {
    try {
      const yamlDiagnosticsOwner = 'yaml-validator';
      
      const validateYaml = (code: string, model: editor.ITextModel) => {
        monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, []);
        
        if (!code.trim()) return;
        
        try {
          yaml.parse(code);
        } catch (error) {
          const yamlError = error as YamlError;
          if (yamlError.linePos?.start) {
            const { line, col } = yamlError.linePos.start;
            const startLineNumber = line;
            const startColumn = col;
            const endLineNumber = yamlError.linePos.end?.line || startLineNumber;
            const endColumn = yamlError.linePos.end?.col || (startColumn + 1);
            
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: yamlError.message || 'YAML syntax error',
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn
            }]);
          } else {
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: yamlError.message || 'YAML syntax error',
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 2
            }]);
          }
        }
      };
      
      const setupModelChangeListener = (model: editor.ITextModel) => {
        if (model.getLanguageId() === 'yaml') {
          validateYaml(model.getValue(), model);
          
          model.onDidChangeContent(() => {
            validateYaml(model.getValue(), model);
          });
        }
      };
      
      monaco.editor.getModels().forEach(model => {
        if (model.getLanguageId() === 'yaml') {
          setupModelChangeListener(model);
        }
      });
      
      monaco.editor.onDidCreateModel(model => {
        if (model.getLanguageId() === 'yaml') {
          setupModelChangeListener(model);
        }
      });
      
    } catch (error) {
      console.error('Error configuring YAML:', error);
    }
  }
};

export default YamlPlugin;