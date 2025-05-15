import { LanguagePlugin, MonacoMarker } from '../code-utils';

// TypeScriptの簡易的な構文チェック
const validateTypeScript = (content: string): { isValid: boolean; error?: string; markers?: MonacoMarker[] } => {
  if (!content.trim()) return { isValid: true, markers: [] };
  
  const markers: MonacoMarker[] = [];
  const lines = content.split('\n');
  
  // 簡易的な構文チェック（実際の実装ではTypeScriptコンパイラやESLintが必要）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 未終了のステートメントをチェック
    if (line.includes('{') && !line.includes('}') && !line.trim().endsWith('{')) {
      // 単一行に開始括弧はあるが閉じ括弧がない場合（意図的な場合も多いのでマーカーとしては追加しない）
    }
    
    // セミコロンの欠落をチェック（簡易的なチェック）
    if (line.trim() && 
        !line.trim().endsWith('{') && 
        !line.trim().endsWith('}') && 
        !line.trim().endsWith(';') &&
        !line.trim().endsWith(',') &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('import') &&
        !line.trim().startsWith('export') &&
        !line.trim().startsWith('function') &&
        !line.trim().startsWith('interface') &&
        !line.trim().startsWith('type') &&
        !line.trim().startsWith('class')) {
        
      markers.push({
        startLineNumber: lineNumber,
        startColumn: line.length + 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        message: 'セミコロンが欠落している可能性があります',
        severity: 4 // monaco.MarkerSeverity.Warning
      });
    }
    
    // 型の使用法をチェック
    if (line.includes(':') && !line.includes('?:')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        const typePart = parts[1].trim();
        
        // 基本型のスペルミスをチェック
        const basicTypes = ['string', 'number', 'boolean', 'any', 'void', 'never', 'unknown', 'object'];
        const typeName = typePart.split(' ')[0].split('|')[0].split('<')[0].trim();
        
        if (typeName && 
            !basicTypes.includes(typeName) && 
            !typeName.startsWith('Array') && 
            !typeName.startsWith('[') &&
            !typeName.startsWith('{') &&
            !typeName.startsWith('(') &&
            typeName.length > 0 && 
            typeName[0] === typeName[0].toLowerCase() && 
            basicTypes.some(t => {
              const distance = levenshteinDistance(t, typeName);
              return distance > 0 && distance <= 2; // 2文字以内の編集距離
            })) {
          
          const typeIndex = line.indexOf(':') + 1;
          const typeStart = typeIndex + line.substring(typeIndex).indexOf(typeName);
          
          markers.push({
            startLineNumber: lineNumber,
            startColumn: typeStart + 1,
            endLineNumber: lineNumber,
            endColumn: typeStart + typeName.length + 1,
            message: '型名のスペルミスの可能性があります',
            severity: 4 // monaco.MarkerSeverity.Warning
          });
        }
      }
    }
  }
  
  return {
    isValid: true, // 警告のみなのでバリデーションは通す
    markers
  };
};

// レーベンシュタイン距離（編集距離）を計算する関数
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // 行列の初期化
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // 距離の計算
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置換
          matrix[i][j - 1] + 1,     // 挿入
          matrix[i - 1][j] + 1      // 削除
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// MonacoエディタへのTypeScript言語の設定
const setupTypeScriptMonaco = (monaco: any) => {
  if (!monaco) return;
  
  // TypeScriptの設定
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false
  });
  
  // コンパイラオプションの設定
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    typeRoots: ["node_modules/@types"]
  });
};

// TypeScriptプラグインのエクスポート
const typescriptPlugin: LanguagePlugin = {
  language: 'typescript',
  validate: validateTypeScript,
  setupMonaco: setupTypeScriptMonaco
};

export default typescriptPlugin; 