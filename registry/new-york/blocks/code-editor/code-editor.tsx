'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

// サポートされる言語タイプの定義
export type SupportedLanguage = 'yaml' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'markdown' | 'plaintext';

// 言語名の取得
export const getLanguageLabel = (language: SupportedLanguage): string => {
  const labels: Record<SupportedLanguage, string> = {
    yaml: 'YAML',
    json: 'JSON',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    markdown: 'Markdown',
    plaintext: 'プレーンテキスト'
  };
  
  return labels[language] || language;
};

// Monaco EditorのWindow拡張用型定義
declare global {
  interface Window {
    monaco?: {
      languages: {
        yaml?: {
          yamlDefaults: {
            setDiagnosticsOptions: (options: any) => void;
          };
        };
      };
    };
  }
}

// Monaco EditorをCDN経由でロードするための設定
const MonacoEditor = dynamic(() => {
  return import('@monaco-editor/react').then(mod => {
    // CDNからMonacoをロードする設定
    mod.loader.config({
      paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs'
      }
    });
    return mod;
  });
}, {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px] border rounded-md bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

// プロパティの型定義
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
};

// 言語サポートを設定する関数
const setupLanguageSupport = async (monaco: any, language: SupportedLanguage) => {
  if (!monaco) return;

  // YAMLだけはCDNから追加の言語サポートを読み込む必要がある
  if (language === 'yaml' && !monaco.languages.yaml) {
    try {
      // YAMLサポートをCDNから読み込み
      if (typeof document !== 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-yaml@4.0.2/lib/umd/monaco-yaml.min.js';
        script.async = true;
        
        // スクリプトの読み込みを待機する
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // monaco-yamlがグローバルにフックするのを待機
        if (window && window.monaco && window.monaco.languages && window.monaco.languages.yaml) {
          window.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: true,
            hover: true,
            completion: true,
            format: true
          });
        }
      }
    } catch (err) {
      console.warn('YAML言語サポートの読み込み中にエラーが発生しました:', err);
    }
  }
  
  // JSONについてはMonacoの組み込み機能が使用される
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  height = '300px',
  placeholder = 'コードを入力してください',
  disabled = false,
  readOnly = false,
  showValidation = true,
  theme: propTheme,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  
  // テーマの決定: プロパティで指定された場合はそれを使用、それ以外はアプリケーションのテーマに従う
  const theme = propTheme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs');
  
  // システムテーマが変更された時にエディタのテーマも更新
  useEffect(() => {
    if (!propTheme && editorRef.current && monacoRef.current) {
      const newTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
      monacoRef.current.editor.setTheme(newTheme);
    }
  }, [resolvedTheme, propTheme]);
  
  // エディタが初期化されたときの処理
  const handleEditorDidMount = async (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 初期テーマを明示的に設定
    const currentTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(currentTheme);

    // YAMLなど、特別な言語サポートの設定
    await setupLanguageSupport(monaco, language);

    // プレースホルダーテキストの設定
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

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (newValue: string | undefined) => {
    if (readOnly || disabled) return;
    
    const content = newValue || '';
    onChange(content);
  };

  // 言語ラベルの取得
  const languageLabel = getLanguageLabel(language);

  return (
    <div className="space-y-2">
      <div 
        className={`border rounded-md overflow-hidden relative ${error ? 'border-destructive' : 'border-input'} ${readOnly ? 'bg-muted/30' : ''}`}
      >
        {/* 言語ラベルバッジ */}
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
            lineNumbersMinChars: 3,
            readOnly: readOnly || disabled,
            renderLineHighlight: 'all',
          }}
          onMount={handleEditorDidMount}
        />
      </div>
      {showValidation && error && (
        <div className="text-xs text-destructive">{error}</div>
      )}
    </div>
  );
};

export default CodeEditor; 