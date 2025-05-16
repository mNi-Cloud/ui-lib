'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { importLanguagePlugin } from '@/registry/new-york/blocks/code-editor/lib/language-plugin';

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
    monaco?: any;
  }
}

// Monaco Editorを動的インポート
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
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

  try {
    // 言語プラグインを動的にインポート
    const plugin = await importLanguagePlugin(language);
    
    if (plugin) {
      // プラグインのロード処理を実行
      await plugin.load();
      
      // 言語固有の設定があれば適用
      if (plugin.configure) {
        plugin.configure(monaco);
      }
    } else {
      console.warn(`言語 '${language}' のプラグインが見つかりません。基本的な構文ハイライトのみが利用可能です。`);
    }
  } catch (error) {
    console.error(`言語 '${language}' のサポート設定中にエラーが発生しました:`, error);
  }
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

    // 言語サポートの設定
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

  // 言語が変更されたときに言語サポートを再設定
  useEffect(() => {
    if (monacoRef.current) {
      setupLanguageSupport(monacoRef.current, language).catch(err => {
        console.error('言語サポートの再設定中にエラーが発生しました:', err);
      });
    }
  }, [language]);

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