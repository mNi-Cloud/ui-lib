'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { 
  getValidator, 
  applyMarkersToModel,
  MonacoMarker,
  getLanguagePlugin
} from './code-utils';
import { initializeLanguagePlugins } from './language-plugins';

// 初期化時に言語プラグインをロード
if (typeof window !== 'undefined') {
  // クライアントサイドでのみ実行
  initializeLanguagePlugins();
}

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
type LanguageValidatorFn = (content: string) => { isValid: boolean; error?: string; markers?: MonacoMarker[] };
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
  useMarkers?: boolean;
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
  validator: customValidator,
  theme: propTheme,
  useMarkers = true,
}) => {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  
  // テーマの決定: プロパティで指定された場合はそれを使用、それ以外はアプリケーションのテーマに従う
  const theme = propTheme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs');
  
  // バリデーターの取得 (カスタムバリデーターが渡されていればそれを使用、なければプラグインシステムから取得)
  const validator = customValidator || getValidator(language);
  
  // バリデーション処理を共通化
  const validateContent = (content: string) => {
    if (!showValidation || !validator) return;
    
    const result = validator(content);
    
    if (!result.isValid) {
      setError(result.error || '不正なフォーマットです');
      
      // Markersの適用（useMarkersがtrueかつmarkersが存在する場合）
      if (useMarkers && result.markers && monacoRef.current && modelRef.current) {
        applyMarkersToModel(monacoRef.current, modelRef.current, result.markers);
      }
    } else {
      setError(null);
      
      // エラーがなくなったらマーカーをクリア
      if (useMarkers && monacoRef.current && modelRef.current) {
        applyMarkersToModel(monacoRef.current, modelRef.current, []);
      }
    }
  };
  
  // エディタが初期化されたときの処理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    modelRef.current = editor.getModel();

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

    // 言語プラグインのMonaco設定を適用
    const languagePlugin = getLanguagePlugin(language);
    if (languagePlugin?.setupMonaco) {
      languagePlugin.setupMonaco(monaco);
    }

    // 初期バリデーション
    if (value) {
      validateContent(value);
    }
  };

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (newValue: string | undefined) => {
    if (readOnly || disabled) return;
    
    const content = newValue || '';
    onChange(content);

    // バリデーション
    validateContent(content);
  };

  // 値が変更されたときのバリデーション
  useEffect(() => {
    if (value) {
      validateContent(value);
    }
  }, [value]);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされるときにマーカーをクリア
      if (useMarkers && monacoRef.current && modelRef.current) {
        applyMarkersToModel(monacoRef.current, modelRef.current, []);
      }
    };
  }, [useMarkers]);

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
      {showValidation && error && !useMarkers && (
        <div className="text-xs text-destructive">{error}</div>
      )}
    </div>
  );
};

export default CodeEditor; 