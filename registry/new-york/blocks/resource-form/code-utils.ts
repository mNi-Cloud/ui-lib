import { SupportedLanguage } from './code-editor';

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

// プラグインレジストリ
const languagePlugins: Map<SupportedLanguage, LanguagePlugin> = new Map();

// プラグインの登録
export function registerLanguagePlugin(plugin: LanguagePlugin) {
  languagePlugins.set(plugin.language, plugin);
}

// プラグインの取得
export function getLanguagePlugin(language: SupportedLanguage): LanguagePlugin | undefined {
  return languagePlugins.get(language);
}

// バリデーターの取得
export function getValidator(language: SupportedLanguage) {
  return languagePlugins.get(language)?.validate || (() => ({ isValid: true, error: undefined, markers: [] }));
}

// Monaco EditorのMarkers APIを使用してエラーを表示する関数
export function applyMarkersToModel(monaco: any, model: any, markers: MonacoMarker[], owner: string = 'linter') {
  if (model && monaco) {
    monaco.editor.setModelMarkers(model, owner, markers);
  }
}

// 各言語のサンプル
export const codeExamples: Record<SupportedLanguage, string> = {
  yaml: `# 基本的なYAMLの例
name: example-service
version: 1.0.0
description: A simple example service
spec:
  replicas: 3
  ports:
    - name: http
      port: 80
      targetPort: 8080
  selector:
    app: example
`,
  json: `{
  "name": "example-service",
  "version": "1.0.0",
  "description": "A simple example service",
  "spec": {
    "replicas": 3,
    "ports": [
      {
        "name": "http",
        "port": 80,
        "targetPort": 8080
      }
    ],
    "selector": {
      "app": "example"
    }
  }
}`,
  javascript: `// 基本的なJavaScriptの例
function calculateTotal(items) {
  return items
    .map(item => item.price * item.quantity)
    .reduce((total, value) => total + value, 0);
}

const items = [
  { name: 'Item 1', price: 100, quantity: 2 },
  { name: 'Item 2', price: 200, quantity: 1 }
];

console.log(calculateTotal(items));`,
  typescript: `// 基本的なTypeScriptの例
interface Item {
  name: string;
  price: number;
  quantity: number;
}

function calculateTotal(items: Item[]): number {
  return items
    .map(item => item.price * item.quantity)
    .reduce((total, value) => total + value, 0);
}

const items: Item[] = [
  { name: 'Item 1', price: 100, quantity: 2 },
  { name: 'Item 2', price: 200, quantity: 1 }
];

console.log(calculateTotal(items));`,
  html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Page</title>
</head>
<body>
  <h1>Example Page</h1>
  <p>This is an example HTML page.</p>
</body>
</html>`,
  css: `/* 基本的なCSSの例 */
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 20px;
}

h1 {
  color: #0066cc;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}`,
  markdown: `# マークダウンの例

## 見出し

これは**太字**で、これは*イタリック*です。

- リストアイテム1
- リストアイテム2
- リストアイテム3

[リンク](https://example.com)

\`\`\`js
// コードブロック
function hello() {
  console.log('Hello, world!');
}
\`\`\``,
  plaintext: `これはプレーンテキストの例です。
特別な書式は適用されません。
複数行のテキストを入力できます。`
};

// YAMLプラグイン - Monaco Editorの言語機能に依存
const yamlPlugin: LanguagePlugin = {
  language: 'yaml',
  validate: (content: string) => {
    if (!content.trim()) return { isValid: true, markers: [] };
    
    // 簡易的なYAML構文チェック（Monacoの言語機能に任せる前の基本検証）
    const markers: MonacoMarker[] = [];
    const lines = content.split('\n');
    
    // インデントの整合性チェック（簡易版）
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      const lineNumber = i + 1;
      
      // コメント行はスキップ
      if (line.trim().startsWith('#')) continue;
      
      // 空行はスキップ
      if (!line.trim()) continue;
      
      // コロンの位置チェック
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const afterColon = line.substring(colonIndex + 1).trim();
        
        // キーの後にコロンがあるが値がなく、次の行がインデントされていない場合
        if (afterColon === '' && i + 1 < lines.length && 
            !lines[i + 1].startsWith(' ') && lines[i + 1].trim() !== '' && 
            !lines[i + 1].trim().startsWith('-') && !lines[i + 1].trim().startsWith('#')) {
          markers.push({
            startLineNumber: lineNumber,
            startColumn: colonIndex + 1,
            endLineNumber: lineNumber,
            endColumn: colonIndex + 2,
            message: 'YAMLの構造エラー: マップのキーの後にはインデントされた値が必要です',
            severity: 8 // monaco.MarkerSeverity.Error
          });
        }
      }
      
      // リストアイテムの不正な構造をチェック
      if (line.trim().startsWith('-')) {
        const dashIndex = line.indexOf('-');
        if (dashIndex > 0) {
          const indent = dashIndex;
          const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
          
          if (nextLine.trim() && !nextLine.trim().startsWith('-') && 
              !nextLine.startsWith(' '.repeat(indent + 2)) && !nextLine.trim().startsWith('#')) {
            markers.push({
              startLineNumber: lineNumber + 1,
              startColumn: 1,
              endLineNumber: lineNumber + 1,
              endColumn: nextLine.length + 1,
              message: 'YAMLの構造エラー: リストアイテムの下のコンテンツは正しくインデントする必要があります',
              severity: 8 // monaco.MarkerSeverity.Error
            });
          }
        }
      }
    }
    
    if (markers.length > 0) {
      return {
        isValid: false,
        error: 'YAML構文エラー',
        markers
      };
    }
    
    return { isValid: true, markers: [] };
  },
  setupMonaco: (monaco) => {
    if (!monaco) return;
    
    // Monaco EditorのYAML言語サポートの設定
    monaco.languages.yaml?.defaults?.setDiagnosticsOptions?.({
      validate: true,
      schemas: [],
      enableSchemaRequest: true,
      format: true
    });
    
    // エディタのテーマに合わせてYAML言語のハイライト設定を調整
    const currentTheme = monaco.editor.getTheme();
    if (currentTheme.includes('light')) {
      // ライトテーマ向けの設定
      monaco.editor.defineTheme('yaml-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {}
      });
    }
  }
};

// JSONプラグイン - 標準的なJSON.parseを使用
const jsonPlugin: LanguagePlugin = {
  language: 'json',
  validate: (content: string) => {
    if (!content.trim()) return { isValid: true, markers: [] };
    
    try {
      // 標準のJSON.parseを使用
      JSON.parse(content);
      return { isValid: true, markers: [] };
    } catch (e) {
      const error = e as Error;
      const errorMessage = `JSON構文エラー: ${error.message}`;
      
      // エラー位置の抽出を試みる
      let position = 0;
      let lineMatch = error.message.match(/at position (\d+)/i);
      if (lineMatch) {
        position = parseInt(lineMatch[1], 10);
      } else {
        // JSONエラーメッセージの形式が異なる場合 (at line X column Y)
        const lineColMatch = error.message.match(/at line (\d+) column (\d+)/i);
        if (lineColMatch) {
          const errorLine = parseInt(lineColMatch[1], 10);
          const errorColumn = parseInt(lineColMatch[2], 10);
          
          // 行と列から位置を計算
          const lines = content.split('\n');
          for (let i = 0; i < errorLine - 1; i++) {
            position += lines[i].length + 1; // +1 for newline
          }
          position += errorColumn - 1;
        }
      }
      
      // 行と列の計算
      const lines = content.split('\n');
      let currentPos = 0;
      let line = 1;
      let column = 1;
      
      for (let i = 0; i < lines.length; i++) {
        if (currentPos + lines[i].length + 1 > position) {
          line = i + 1;
          column = position - currentPos + 1;
          break;
        }
        currentPos += lines[i].length + 1; // +1 for newline
      }
      
      const markers: MonacoMarker[] = [{
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 1,
        message: errorMessage,
        severity: 8 // monaco.MarkerSeverity.Error
      }];
      
      return {
        isValid: false,
        error: errorMessage,
        markers
      };
    }
  },
  setupMonaco: (monaco) => {
    if (!monaco) return;
    
    // Monaco EditorのJSON言語サポートを設定
    monaco.languages.json?.defaults?.setDiagnosticsOptions?.({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true
    });
    
    // エディタのテーマに合わせてJSON言語のハイライト設定を調整
    const currentTheme = monaco.editor.getTheme();
    if (currentTheme.includes('light')) {
      // ライトテーマ向けの設定
      monaco.editor.defineTheme('json-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {}
      });
    }
  }
};

// その他の言語のプラグイン（簡易版）
const createSimplePlugin = (language: SupportedLanguage): LanguagePlugin => ({
  language,
  validate: () => ({ isValid: true, markers: [] }),
  setupMonaco: () => {}
});

// プラグインの登録
registerLanguagePlugin(yamlPlugin);
registerLanguagePlugin(jsonPlugin);
registerLanguagePlugin(createSimplePlugin('javascript'));
registerLanguagePlugin(createSimplePlugin('typescript'));
registerLanguagePlugin(createSimplePlugin('html'));
registerLanguagePlugin(createSimplePlugin('css'));
registerLanguagePlugin(createSimplePlugin('markdown'));
registerLanguagePlugin(createSimplePlugin('plaintext'));

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