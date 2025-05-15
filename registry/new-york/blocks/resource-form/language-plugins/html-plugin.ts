import { LanguagePlugin, MonacoMarker } from '../code-utils';

// HTMLの簡易的な構文チェック
const validateHTML = (content: string): { isValid: boolean; error?: string; markers?: MonacoMarker[] } => {
  if (!content.trim()) return { isValid: true, markers: [] };
  
  const markers: MonacoMarker[] = [];
  const lines = content.split('\n');
  
  // タグの開始と終了をチェック
  const openTags: { tag: string; line: number; column: number }[] = [];
  const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'keygen', 'param', 'source', 'track', 'wbr'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 開始タグと終了タグを検出
    let pos = 0;
    while (pos < line.length) {
      const openIndex = line.indexOf('<', pos);
      if (openIndex === -1) break;
      
      const closeIndex = line.indexOf('>', openIndex);
      if (closeIndex === -1) {
        // 終了タグがない
        markers.push({
          startLineNumber: lineNumber,
          startColumn: openIndex + 1,
          endLineNumber: lineNumber,
          endColumn: openIndex + 2,
          message: 'タグが閉じられていません',
          severity: 8 // monaco.MarkerSeverity.Error
        });
        break;
      }
      
      const tagContent = line.substring(openIndex + 1, closeIndex);
      
      if (tagContent.startsWith('/')) {
        // 終了タグ
        const tagName = tagContent.substring(1).trim().split(' ')[0];
        
        if (openTags.length === 0) {
          // 対応する開始タグがない
          markers.push({
            startLineNumber: lineNumber,
            startColumn: openIndex + 1,
            endLineNumber: lineNumber,
            endColumn: closeIndex + 1,
            message: `"${tagName}"タグに対応する開始タグが見つかりません`,
            severity: 8 // monaco.MarkerSeverity.Error
          });
        } else {
          const lastOpenTag = openTags.pop();
          if (lastOpenTag && lastOpenTag.tag !== tagName) {
            // タグの不一致
            markers.push({
              startLineNumber: lineNumber,
              startColumn: openIndex + 1,
              endLineNumber: lineNumber,
              endColumn: closeIndex + 1,
              message: `"${tagName}"タグが"${lastOpenTag.tag}"タグと一致しません`,
              severity: 8 // monaco.MarkerSeverity.Error
            });
            // 開始タグを戻す
            openTags.push(lastOpenTag);
          }
        }
      } else if (!tagContent.endsWith('/') && !tagContent.startsWith('!') && !tagContent.startsWith('?')) {
        // 開始タグ（自己終了タグでない場合）
        const tagName = tagContent.trim().split(' ')[0];
        
        if (!selfClosingTags.includes(tagName.toLowerCase())) {
          openTags.push({
            tag: tagName,
            line: lineNumber,
            column: openIndex + 1
          });
        }
      }
      
      pos = closeIndex + 1;
    }
  }
  
  // 閉じられていないタグをチェック
  for (const openTag of openTags) {
    markers.push({
      startLineNumber: openTag.line,
      startColumn: openTag.column,
      endLineNumber: openTag.line,
      endColumn: openTag.column + openTag.tag.length + 1,
      message: `"${openTag.tag}"タグが閉じられていません`,
      severity: 8 // monaco.MarkerSeverity.Error
    });
  }
  
  // マーカーがあればエラーとする
  const hasErrors = markers.length > 0;
  
  return {
    isValid: !hasErrors,
    error: hasErrors ? 'HTML構文エラーがあります' : undefined,
    markers
  };
};

// MonacoエディタへのHTML言語の設定
const setupHTMLMonaco = (monaco: any) => {
  if (!monaco) return;
  
  // HTML言語の設定
  monaco.languages.html?.defaults?.setDiagnosticsOptions?.({
    validate: true,
  });
};

// HTMLプラグインのエクスポート
const htmlPlugin: LanguagePlugin = {
  language: 'html',
  validate: validateHTML,
  setupMonaco: setupHTMLMonaco
};

export default htmlPlugin; 