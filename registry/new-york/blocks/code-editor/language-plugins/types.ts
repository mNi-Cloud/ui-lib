// サポートされる言語タイプの定義
export type SupportedLanguage = 'yaml' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'markdown' | 'plaintext';

// プラグインインターフェース
export interface LanguagePlugin {
  language: SupportedLanguage;
  validate: (content: string) => { isValid: boolean; error?: string; markers?: MonacoMarker[] };
  getModelOptions?: () => any;
  setupMonaco?: (monaco: any) => void;
}

// Monaco Editorのマーカー型定義
export interface MonacoMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number; // monaco.MarkerSeverity の値
}

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

// 言語のファイル拡張子
export const getLanguageExtension = (language: SupportedLanguage): string => {
  const extensions: Record<SupportedLanguage, string> = {
    yaml: 'yml',
    json: 'json',
    javascript: 'js',
    typescript: 'ts',
    html: 'html',
    css: 'css',
    markdown: 'md',
    plaintext: 'txt'
  };
  
  return extensions[language];
}; 