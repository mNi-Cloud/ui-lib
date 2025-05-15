'use client';

// YAMLクライアントサイド検証用
import * as YAML from 'yaml';

/**
 * YAML文字列を検証する関数
 * @param content 検証するYAML文字列
 * @returns 検証結果と、エラーがあればエラーメッセージを含むオブジェクト
 */
export function validateYaml(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: true };
  }

  try {
    YAML.parse(content);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid YAML format' 
    };
  }
}

/**
 * YAMLの書式の例
 */
export const yamlExamples = {
  basic: `# 基本的なYAML例
name: John Doe
age: 30
isActive: true
`,
  array: `# 配列の例
fruits:
  - apple
  - banana
  - orange
`,
  nested: `# ネストされたオブジェクトの例
person:
  name: Jane Smith
  address:
    street: 123 Main St
    city: Anytown
    zip: 12345
  hobbies:
    - reading
    - swimming
`
}; 