'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Monaco Editorをクライアントサイドでのみロードするために動的にインポート
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px] border rounded-md bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

// サポートする言語とそのバリデーション関数の型
type LanguageValidatorFn = (content: string) => { isValid: boolean; error?: string };
export type SupportedLanguage = 'yaml' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'markdown' | 'plaintext';

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
  validator?: LanguageValidatorFn;
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
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
  validator,
  theme = 'vs-dark',
}) => {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // エディタが初期化されたときの処理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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

    // 初期バリデーション
    if (showValidation && validator && value) {
      const result = validator(value);
      if (!result.isValid) {
        setError(result.error || '不正なフォーマットです');
      } else {
        setError(null);
      }
    }
  };

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (newValue: string | undefined) => {
    if (readOnly || disabled) return;
    
    const content = newValue || '';
    onChange(content);

    // バリデーション
    if (showValidation && validator) {
      const result = validator(content);
      if (!result.isValid) {
        setError(result.error || '不正なフォーマットです');
      } else {
        setError(null);
      }
    }
  };

  // 値が変更されたときのバリデーション
  useEffect(() => {
    if (showValidation && validator && value) {
      const result = validator(value);
      if (!result.isValid) {
        setError(result.error || '不正なフォーマットです');
      } else {
        setError(null);
      }
    }
  }, [value, showValidation, validator]);

  return (
    <div className="space-y-2">
      <div 
        className={`border rounded-md overflow-hidden ${error ? 'border-destructive' : 'border-input'} ${readOnly ? 'bg-muted/30' : ''}`}
      >
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