'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { importLanguagePlugin } from '@/registry/new-york/blocks/language-plugin/index';

export type SupportedLanguage = 'yaml' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'markdown' | 'plaintext';

export interface SyntaxError {
  message: string;
  line: number;
  column: number;
}

export const getLanguageLabel = (language: SupportedLanguage): string => {
  const labels: Record<SupportedLanguage, string> = {
    yaml: 'YAML',
    json: 'JSON',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    markdown: 'Markdown',
    plaintext: 'Plain Text'
  };
  
  return labels[language] || language;
};

declare global {
  interface Window {
    monaco?: any;
  }
}

if (typeof window !== 'undefined') {
  const env = window.MonacoEnvironment || {};
  window.MonacoEnvironment = env;
  
  const originalGetWorkerUrl = env.getWorkerUrl;
  
  env.getWorkerUrl = (moduleId: string, label: string): string => {
    if (originalGetWorkerUrl) {
      const url = originalGetWorkerUrl(moduleId, label);
      if (url) return url;
    }
    
    if (label === 'json') {
      return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/json/json.worker.js';
    } else if (label === 'typescript' || label === 'javascript') {
      return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/typescript/ts.worker.js';
    } else if (label === 'html' || label === 'css') {
      return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/html/html.worker.js';
    }
    
    return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/editor/editor.worker.js';
  };
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px] border rounded-md bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: SupportedLanguage;
  height?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showValidation?: boolean;
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  onValidationChange?: (hasErrors: boolean) => void;
};

const setupLanguageSupport = async (monaco: any, language: SupportedLanguage) => {
  if (!monaco) return;

  try {
    const plugin = await importLanguagePlugin(language);
    
    if (plugin) {
      await plugin.load();
      
      if (plugin.configure) {
        plugin.configure(monaco);
      }
    } else {
      console.warn(`Plugin for '${language}' language not found. Only basic syntax highlighting will be available.`);
    }
  } catch (error) {
    console.error(`Error setting up '${language}' language support:`, error);
  }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  height = '300px',
  placeholder = 'Enter code here',
  disabled = false,
  readOnly = false,
  showValidation = true,
  theme: propTheme,
  onValidationChange,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();
  
  const theme = propTheme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs');
  
  useEffect(() => {
    if (!propTheme && editorRef.current && monacoRef.current) {
      const newTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
      monacoRef.current.editor.setTheme(newTheme);
    }
  }, [resolvedTheme, propTheme]);
  
  const handleEditorDidMount = async (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const currentTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(currentTheme);

    await setupLanguageSupport(monaco, language);

    monaco.editor.onDidChangeMarkers(([resource]: any[]) => {
      if (editor.getModel() && editor.getModel().uri.toString() === resource.toString()) {
        const markers = monaco.editor.getModelMarkers({ resource });
        const errorMarkers = markers.filter((marker: any) => marker.severity === monaco.MarkerSeverity.Error);
        
        const newHasErrors = errorMarkers.length > 0;
        setHasErrors(newHasErrors);
        
        if (errorMarkers.length > 0) {
          const firstError = errorMarkers[0];
          setError(`${firstError.message} (line ${firstError.startLineNumber}, column ${firstError.startColumn})`);
        } else {
          setError(null);
        }

        onValidationChange?.(newHasErrors);
      }
    });

    if (!value && placeholder) {
      editor.getModel()?.setValue(placeholder);
      editor.onDidFocusEditorText(() => {
        if (editor.getValue() === placeholder) {
          editor.getModel()?.setValue('');
        }
      });
      editor.onDidBlurEditorText(() => {
        if (editor.getValue() === '') {
          editor.getModel()?.setValue(placeholder);
        }
      });
    }
  };

  useEffect(() => {
    if (monacoRef.current) {
      setupLanguageSupport(monacoRef.current, language).catch(err => {
        console.error('Error resetting language support:', err);
      });
    }
  }, [language]);

  const handleEditorChange = (newValue: string | undefined) => {
    if (readOnly || disabled) return;
    
    const content = newValue || '';
    onChange(content);
  };

  const languageLabel = getLanguageLabel(language);

  return (
    <div className="space-y-2">
      <div 
        className={`border rounded-md overflow-hidden relative ${error ? 'border-destructive' : 'border-input'} ${readOnly ? 'bg-muted/30' : ''}`}
      >
        <div className="absolute top-1 right-1 z-10 px-2 py-0.5 rounded bg-primary/10 text-xs font-medium text-primary-foreground backdrop-blur-sm">
          {languageLabel}
        </div>

        <MonacoEditor
          value={value}
          onChange={handleEditorChange}
          language={language}
          height={height}
          theme={theme}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            folding: true,
            wordWrap: 'on',
            automaticLayout: true,
            contextmenu: true,
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false
            },
            readOnly: readOnly || disabled,
            domReadOnly: readOnly || disabled,
            padding: { top: 12, bottom: 12 },
          }}
          onMount={handleEditorDidMount}
        />
      </div>
      
      {showValidation && error && (
        <div className="text-sm text-destructive px-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;