import { SupportedLanguage } from './types';
import type { LanguagePlugin, MonacoMarker } from './core';

// YAMLプラグイン - Monaco Editorの言語機能に依存
const yamlPlugin: LanguagePlugin = {
  language: 'yaml' as SupportedLanguage,
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

import { registerLanguagePlugin } from './core';
registerLanguagePlugin(yamlPlugin);

export default yamlPlugin; 