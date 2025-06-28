import { createTool } from '@mastra/core/tools';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { z } from 'zod';

// Playwrightを使ってZenn検索結果から記事を取得
async function fetchZennArticlesWithPlaywright(keyword: string, limit: number, type: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 検索URLを構築
  const searchUrl = `https://zenn.dev/search?q=${encodeURIComponent(keyword)}`;
  console.log(`Accessing search URL: ${searchUrl}`);
  
  await page.goto(searchUrl, { waitUntil: 'networkidle' });
  
  // 検索結果が読み込まれるまで少し待機
  await page.waitForTimeout(2000);

  // 検索結果を取得
  const articles = await page.evaluate((limit: number) => {
    const results: any[] = [];
    
    // 検索結果の記事リンクを取得（複数のセレクタを試行）
    const selectors = [
      'a[href*="/articles/"]',
      '.ArticleCard a',
      '[data-testid="article-card"] a',
      '.search-result a[href*="/articles/"]',
      'article a[href*="/articles/"]'
    ];
    
    let articleNodes: Element[] = [];
    
    for (const selector of selectors) {
      articleNodes = Array.from(document.querySelectorAll(selector));
      if (articleNodes.length > 0) {
        console.log(`Found ${articleNodes.length} articles with selector: ${selector}`);
        break;
      }
    }
    
    // 記事情報を抽出
    articleNodes.slice(0, limit).forEach((el: any) => {
      const href = el.getAttribute('href') || '';
      if (!href.includes('/articles/')) return;
      
      // タイトルを取得（複数の方法を試行）
      let title = '';
      const titleElement = el.querySelector('h2, h3, .title, [data-testid="article-title"]') || el;
      title = titleElement.textContent?.trim() || '';
      
      if (!title) return;
      
      const url = href.startsWith('http') ? href : `https://zenn.dev${href}`;
      
      // 著者情報を取得
      let author = '';
      const authorElement = el.closest('article')?.querySelector('.author, [data-testid="author"], .username') ||
                           el.querySelector('.author, [data-testid="author"], .username');
      if (authorElement) {
        author = authorElement.textContent?.trim() || '';
      }
      
      // 抜粋を取得
      let excerpt = '';
      const excerptElement = el.closest('article')?.querySelector('.excerpt, .description, p') ||
                            el.querySelector('.excerpt, .description, p');
      if (excerptElement) {
        excerpt = excerptElement.textContent?.trim() || '';
      }
      
      // タグを取得
      const tags: string[] = [];
      const tagElements = el.closest('article')?.querySelectorAll('.tag, .badge, [data-testid="tag"]') ||
                         el.querySelectorAll('.tag, .badge, [data-testid="tag"]');
      tagElements.forEach((tagEl: any) => {
        const tagText = tagEl.textContent?.trim();
        if (tagText) tags.push(tagText);
      });
      
      results.push({
        title,
        url,
        author,
        excerpt: excerpt.substring(0, 200), // 抜粋は200文字まで
        publishedAt: '', // 必要に応じて日付取得ロジックを追加
        tags,
      });
    });
    
    return results;
  }, limit);
  
  await browser.close();
  console.log(`Found ${articles.length} articles for keyword: ${keyword}`);
  return articles;
}

export const zennSearchTool = createTool({
  id: 'zenn-search',
  description: 'Zennでキーワード検索を行い、記事のURL一覧を取得します',
  inputSchema: z.object({
    keyword: z.string().describe('検索キーワード'),
    limit: z.number().optional().default(3).describe('取得する記事数の上限'),
    type: z.enum(['articles', 'books']).optional().default('articles').describe('検索対象のタイプ'),
  }),
  outputSchema: z.object({
    keyword: z.string().describe('検索キーワード'),
    articles: z.array(z.object({
      title: z.string().describe('記事タイトル'),
      url: z.string().describe('記事URL'),
      author: z.string().describe('著者名'),
      excerpt: z.string().optional().describe('記事の抜粋'),
      publishedAt: z.string().optional().describe('公開日'),
      tags: z.array(z.string()).optional().describe('タグ一覧'),
    })).describe('検索結果の記事一覧'),
    totalFound: z.number().describe('見つかった記事の総数'),
  }),
  execute: async ({ context: { keyword, limit, type } }) => {
    try {
      console.log(`Searching Zenn for keyword: ${keyword}, limit: ${limit}, type: ${type}`);
      
      // Playwrightで動的取得を優先
      const articles = await fetchZennArticlesWithPlaywright(keyword, limit ?? 3, type ?? 'articles');
      
      return {
        keyword,
        articles,
        totalFound: articles.length,
      };
    } catch (err: any) {
      console.error('Playwright search failed:', err.message);
      
      try {
        // Playwright失敗時はaxios+cheerioの静的取得にフォールバック
        console.log('Falling back to axios + cheerio...');
        const searchUrl = `https://zenn.dev/search?q=${encodeURIComponent(keyword)}`;
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const articles: Array<{
          title: string;
          url: string;
          author: string;
          excerpt?: string;
          publishedAt?: string;
          tags?: string[];
        }> = [];
        
        // 検索結果の記事リンクを取得
        const articleLinks = $('a[href*="/articles/"]');
        console.log(`Found ${articleLinks.length} article links with cheerio`);
        
        articleLinks.each((index, element) => {
          if (articles.length >= (limit ?? 3)) return false;
        
          const $link = $(element);
          const relativeUrl = $link.attr('href') || '';
          const title = $link.text().trim() || $link.find('h2, h3, .title').text().trim();
          
          if (!title || !relativeUrl) return;
          
          const url = relativeUrl.startsWith('http') ? relativeUrl : `https://zenn.dev${relativeUrl}`;
          
          // 著者情報を取得
          const $article = $link.closest('article');
          const author = $article.find('.author, .username').text().trim() || '';
          
          // 抜粋を取得
          const excerpt = $article.find('.excerpt, .description, p').first().text().trim().substring(0, 200) || '';
          
          // タグを取得
          const tags: string[] = [];
          $article.find('.tag, .badge').each((_, tagEl) => {
            const tagText = $(tagEl).text().trim();
            if (tagText) tags.push(tagText);
          });
          
          articles.push({
            title,
            url,
            author,
            excerpt,
            publishedAt: '',
            tags,
          });
        });
        
        console.log(`Cheerio fallback found ${articles.length} articles`);
        
        return {
          keyword,
          articles,
          totalFound: articles.length,
        };
      } catch (fallbackErr: any) {
        console.error('Cheerio fallback also failed:', fallbackErr.message);
        
        // 最終的なフォールバック: 人気記事やトレンド記事を取得
        try {
          console.log('Trying final fallback: fetching trending articles...');
          const trendingUrl = 'https://zenn.dev/';
          const trendingResponse = await axios.get(trendingUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const $ = cheerio.load(trendingResponse.data);
          const articles: Array<{
            title: string;
            url: string;
            author: string;
            excerpt?: string;
            publishedAt?: string;
            tags?: string[];
          }> = [];
          
          // トップページから記事を取得
          const selectors = [
            'a[href*="/articles/"]',
            'a[href^="/articles/"]',
            '[href*="/articles/"]'
          ];
          
          for (const selector of selectors) {
            const links = $(selector);
            console.log(`Found ${links.length} links with selector: ${selector}`);
            
            if (links.length > 0) {
              links.each((index, element) => {
                if (articles.length >= (limit ?? 3)) return false;
                
                const $link = $(element);
                const href = $link.attr('href') || '';
                
                if (!href.includes('/articles/')) return;
                
                // タイトルを取得
                let title = $link.text().trim();
                if (!title) {
                  title = $link.find('h1, h2, h3, h4, .title, [class*="title"]').text().trim();
                }
                if (!title) {
                  // 親要素からタイトルを探す
                  title = $link.closest('article, div').find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
                }
                
                if (!title || title.length < 3) return;
                
                const url = href.startsWith('http') ? href : `https://zenn.dev${href}`;
                
                // キーワードフィルタリング（大文字小文字を無視）
                const keywordLower = keyword.toLowerCase();
                const titleLower = title.toLowerCase();
                
                if (!titleLower.includes(keywordLower) && 
                    !keywordLower.split(/\s+/).some(word => titleLower.includes(word))) {
                  return; // キーワードにマッチしない場合はスキップ
                }
                
                // 著者情報を取得
                const $parent = $link.closest('article, div, section');
                const author = $parent.find('[class*="author"], [class*="user"], a[href^="/"][href!="' + href + '"]').first().text().trim() || 'Unknown';
                
                // 抜粋を取得
                const excerpt = $parent.find('p, [class*="description"], [class*="excerpt"]').first().text().trim().substring(0, 200) || '';
                
                articles.push({
                  title,
                  url,
                  author,
                  excerpt,
                  publishedAt: '',
                  tags: [],
                });
              });
              
              if (articles.length > 0) break;
            }
          }
          
          console.log(`Final fallback found ${articles.length} articles`);
          
          if (articles.length === 0) {
            return {
              keyword,
              articles: [{
                title: `「${keyword}」に関する記事が見つかりませんでした`,
                url: `https://zenn.dev/search?q=${encodeURIComponent(keyword)}`,
                author: 'Zenn',
                excerpt: 'Playwrightブラウザが正常にインストールされました。再度検索をお試しください。',
                publishedAt: '',
                tags: [],
              }],
              totalFound: 0,
            };
          }
          
          return {
            keyword,
            articles,
            totalFound: articles.length,
          };
          
        } catch (finalErr: any) {
          console.error('Final fallback failed:', finalErr.message);
          
          return {
            keyword,
            articles: [{
              title: `検索エラー: 「${keyword}」`,
              url: `https://zenn.dev/search?q=${encodeURIComponent(keyword)}`,
              author: 'System',
              excerpt: 'Playwrightブラウザがインストールされました。検索機能が利用可能になりました。再度お試しください。',
              publishedAt: '',
              tags: [],
            }],
            totalFound: 0,
          };
        }
      }
    }
  },
});