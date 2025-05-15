import { registerLanguagePlugin } from '../code-utils';
import typescriptPlugin from './typescript-plugin';
import htmlPlugin from './html-plugin';
import cssPlugin from './css-plugin';

// すべてのプラグインを登録する
export function registerAllPlugins() {
  // TypeScriptプラグインを登録
  registerLanguagePlugin(typescriptPlugin);
  
  // HTMLプラグインを登録
  registerLanguagePlugin(htmlPlugin);
  
  // CSSプラグインを登録
  registerLanguagePlugin(cssPlugin);
  
  // 将来: 他の言語プラグインもここで登録
  // registerLanguagePlugin(javascriptPlugin);
  // ...
}

// 初期化時に呼び出す
export function initializeLanguagePlugins() {
  registerAllPlugins();
  console.log('言語プラグインの初期化が完了しました');
}

export default {
  registerAllPlugins,
  initializeLanguagePlugins
}; 