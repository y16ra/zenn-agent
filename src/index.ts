import 'dotenv/config';
import { mastra } from './mastra';

async function main() {
  // コマンドライン引数から入力を取得
  const input = process.argv[2];
  
  if (!input) {
    console.error('使用方法:');
    console.error('  記事URL要約: npm run dev <Zenn記事URL>');
    console.error('  キーワード検索: npm run dev <キーワード>');
    console.error('');
    console.error('例:');
    console.error('  npm run dev https://zenn.dev/example/articles/example-article');
    console.error('  npm run dev React');
    console.error('  npm run dev "Next.js"');
    process.exit(1);
  }
  
  try {
    // 入力がURLかキーワードかを判定
    const isUrl = input.includes('zenn.dev') && (input.startsWith('http://') || input.startsWith('https://'));
    
    if (isUrl) {
      console.log('🚀 Zenn記事を要約中...\n');
      
      // エージェントを実行（記事URL）
      const result = await mastra.getAgent('zennSummarizerAgent').generate(
        `次のZenn記事を要約してください: ${input}`
      );
      
      console.log(result.text);
    } else {
      console.log(`🔍 "${input}" で記事を検索中...\n`);
      
      // エージェントを実行（キーワード検索）
      const result = await mastra.getAgent('zennSummarizerAgent').generate(
        `キーワード「${input}」でZenn記事を検索して、関連記事を要約してください`
      );
      
      console.log(result.text);
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// メイン関数を実行
if (require.main === module) {
  main().catch(console.error);
}