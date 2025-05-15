import { parse as parseYaml } from 'yaml';
import json5 from 'json5';
import { SupportedLanguage } from './code-editor';

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

// YAMLバリデーション
export const validateYaml = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) return { isValid: true };
  
  try {
    parseYaml(content);
    return { isValid: true };
  } catch (e) {
    const error = e as Error;
    return {
      isValid: false,
      error: `YAML構文エラー: ${error.message}`
    };
  }
};

// JSONバリデーション
export const validateJson = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) return { isValid: true };
  
  try {
    json5.parse(content);
    return { isValid: true };
  } catch (e) {
    const error = e as Error;
    return {
      isValid: false,
      error: `JSON構文エラー: ${error.message}`
    };
  }
};

// 各言語のバリデーション関数
export const validators: Record<SupportedLanguage, (content: string) => { isValid: boolean; error?: string }> = {
  yaml: validateYaml,
  json: validateJson,
  javascript: () => ({ isValid: true }), // シンプルなバリデーションのみ
  typescript: () => ({ isValid: true }),
  html: () => ({ isValid: true }),
  css: () => ({ isValid: true }),
  markdown: () => ({ isValid: true }),
  plaintext: () => ({ isValid: true })
};

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