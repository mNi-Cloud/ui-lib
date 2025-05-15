import { SupportedLanguage } from './types';

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

// 言語プラグインの初期化
export function initializeLanguagePlugins() {
  // プラグインが既に登録されている場合は何もしない
  if (languagePlugins.size > 0) return;
  
  // ここでプラグインを登録
  // コアモジュールでは各言語プラグインをインポートせず、
  // index.tsで個別にimportしてregisterLanguagePluginを呼び出すことで
  // 循環参照を防止します
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

// その他の言語のプラグイン（簡易版）
export const createSimplePlugin = (language: SupportedLanguage): LanguagePlugin => ({
  language,
  validate: () => ({ isValid: true, markers: [] }),
  setupMonaco: () => {}
});

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