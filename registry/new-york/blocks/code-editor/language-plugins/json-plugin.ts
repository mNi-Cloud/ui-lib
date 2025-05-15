import { SupportedLanguage } from './language-plugins-types';
import type { LanguagePlugin, MonacoMarker } from './language-plugins-core';

// JSONプラグイン - 標準的なJSON.parseを使用
const jsonPlugin: LanguagePlugin = {
  language: 'json' as SupportedLanguage,
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
    // getThemeは関数ではないのでチェック方法を変更
    try {
      const currentTheme = monaco.editor._themeService?.getThemeId() || '';
      if (currentTheme.includes('light')) {
        // ライトテーマ向けの設定
        monaco.editor.defineTheme('json-light', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: {}
        });
      }
    } catch (e) {
      // テーマサービスにアクセスできない場合は無視
      console.warn('モナコエディタのテーマ情報にアクセスできません:', e);
    }
  }
};

import { registerLanguagePlugin } from './language-plugins-core';
registerLanguagePlugin(jsonPlugin);

export default jsonPlugin; 