import { LanguagePlugin, MonacoMarker } from '../code-utils';

// CSSの簡易的な構文チェック
const validateCSS = (content: string): { isValid: boolean; error?: string; markers?: MonacoMarker[] } => {
  if (!content.trim()) return { isValid: true, markers: [] };
  
  const markers: MonacoMarker[] = [];
  const lines = content.split('\n');
  
  // 簡易的な構文チェック
  let isInBlock = false;
  let blockStartLine = 0;
  let openBraces = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // コメント行はスキップ（簡易判定）
    if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('*/')) continue;
    if (line.trim().startsWith('//')) continue;
    
    // 空行はスキップ
    if (!line.trim()) continue;
    
    // 波括弧のカウント
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '{') {
        if (!isInBlock) {
          isInBlock = true;
          blockStartLine = lineNumber;
        }
        openBraces++;
      } else if (line[j] === '}') {
        openBraces--;
        if (openBraces === 0) {
          isInBlock = false;
        } else if (openBraces < 0) {
          markers.push({
            startLineNumber: lineNumber,
            startColumn: j + 1,
            endLineNumber: lineNumber,
            endColumn: j + 2,
            message: '閉じ括弧が多すぎます',
            severity: 8 // monaco.MarkerSeverity.Error
          });
          openBraces = 0; // リセット
        }
      }
    }
    
    // セミコロンの欠落をチェック
    if (isInBlock && !line.includes('{') && !line.includes('}') && line.trim() && !line.trim().endsWith(';')) {
      markers.push({
        startLineNumber: lineNumber,
        startColumn: line.length + 1,
        endLineNumber: lineNumber,
        endColumn: line.length + 1,
        message: 'セミコロンが欠落している可能性があります',
        severity: 4 // monaco.MarkerSeverity.Warning
      });
    }
    
    // プロパティ定義のチェック
    if (isInBlock && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      // コロンの前後にスペースがあるかチェック（スタイルガイド）
      if (colonIndex > 0 && line[colonIndex - 1] === ' ') {
        markers.push({
          startLineNumber: lineNumber,
          startColumn: colonIndex,
          endLineNumber: lineNumber,
          endColumn: colonIndex + 1,
          message: 'コロンの前にスペースを入れるべきではありません',
          severity: 4 // monaco.MarkerSeverity.Warning
        });
      }
      
      // 値がない場合
      if (colonIndex === line.trim().length - 1) {
        markers.push({
          startLineNumber: lineNumber,
          startColumn: colonIndex + 1,
          endLineNumber: lineNumber,
          endColumn: colonIndex + 2,
          message: 'プロパティに値が指定されていません',
          severity: 8 // monaco.MarkerSeverity.Error
        });
      }
    }
  }
  
  // 閉じられていないブロックをチェック
  if (openBraces > 0) {
    markers.push({
      startLineNumber: blockStartLine,
      startColumn: 1,
      endLineNumber: blockStartLine,
      endColumn: lines[blockStartLine - 1].length + 1,
      message: `${openBraces}個の閉じ括弧が不足しています`,
      severity: 8 // monaco.MarkerSeverity.Error
    });
  }
  
  return {
    isValid: !markers.some(marker => marker.severity === 8), // エラーがある場合のみ無効
    error: markers.some(marker => marker.severity === 8) ? 'CSS構文エラーがあります' : undefined,
    markers
  };
};

// MonacoエディタへのCSS言語の設定
const setupCSSMonaco = (monaco: any) => {
  if (!monaco) return;
  
  // CSS言語の設定
  monaco.languages.css?.defaults?.setDiagnosticsOptions?.({
    validate: true,
    lint: {
      compatibleVendorPrefixes: 'warning',
      vendorPrefix: 'warning',
      duplicateProperties: 'warning',
      emptyRules: 'warning',
      importStatement: 'warning',
      boxModel: 'warning',
      universalSelector: 'warning',
      zeroUnits: 'warning',
      fontFaceProperties: 'warning',
      hexColorLength: 'warning',
      argumentsInColorFunction: 'warning',
      unknownProperties: 'warning',
      ieHack: 'warning',
      unknownVendorSpecificProperties: 'warning',
      propertyIgnoredDueToDisplay: 'warning',
      important: 'warning',
      float: 'warning'
    }
  });
};

// CSSプラグインのエクスポート
const cssPlugin: LanguagePlugin = {
  language: 'css',
  validate: validateCSS,
  setupMonaco: setupCSSMonaco
};

export default cssPlugin; 