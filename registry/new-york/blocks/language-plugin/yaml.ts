import type { LanguagePlugin } from './index';
import * as yaml from 'yaml';

/**
 * モナコエディタのYAML言語サポートを提供するプラグイン。
 * yamlライブラリを使用して独自にバリデーションを実装します。
 */
const YamlPlugin: LanguagePlugin = {
  language: 'yaml',
  
  // 言語サポートをロードする関数
  load: async () => {
    // yamlパッケージは依存関係として追加する必要があります
    // npm install yaml
    return Promise.resolve();
  },
  
  // エディタインスタンスに言語設定を適用する関数
  configure: (monaco: any) => {
    try {
      // YAML用のシンプルなマーカーを登録
      const yamlDiagnosticsOwner = 'yaml-validator';
      
      // バリデーション関数を定義
      const validateYaml = (code: string, model: any) => {
        // 既存のマーカーをクリア
        monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, []);
        
        // 空のコードはバリデーションをスキップ
        if (!code.trim()) return;
        
        try {
          // YAMLをパース（バリデーション）
          yaml.parse(code);
        } catch (error: any) {
          // yamlライブラリのエラー形式に合わせてエラー処理
          if (error.linePos && error.linePos.start) {
            // エラーマーカーを作成
            const { line, col } = error.linePos.start;
            const startLineNumber = line;
            const startColumn = col;
            const endLineNumber = error.linePos.end?.line || startLineNumber;
            const endColumn = error.linePos.end?.col || (startColumn + 1);
            
            // マーカーをセット
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: error.message || 'YAMLの構文エラー',
              startLineNumber,
              startColumn,
              endLineNumber,
              endColumn
            }]);
          } else {
            // 位置情報がない場合は、一般的なエラーとして表示
            monaco.editor.setModelMarkers(model, yamlDiagnosticsOwner, [{
              severity: monaco.MarkerSeverity.Error,
              message: error.message || 'YAMLの構文エラー',
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 2
            }]);
          }
        }
      };
      
      // モデル変更イベントリスナーを追加
      const setupModelChangeListener = (model: any) => {
        if (model.getLanguageId() === 'yaml') {
          // 初期バリデーション
          validateYaml(model.getValue(), model);
          
          // 変更時にバリデーション
          model.onDidChangeContent(() => {
            validateYaml(model.getValue(), model);
          });
        }
      };
      
      // 既存のモデルに適用
      monaco.editor.getModels().forEach(setupModelChangeListener);
      
      // 新しいモデルにも適用
      monaco.editor.onDidCreateModel(setupModelChangeListener);
      
    } catch (error) {
      console.error('YAML設定中にエラーが発生しました:', error);
    }
  }
};

export default YamlPlugin; 