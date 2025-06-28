import { createTool } from '@mastra/core/tools';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

export const zennScraperTool = createTool({
  id: 'zenn-scraper',
  description: 'Zennの記事URLから記事の内容を取得します',
  inputSchema: z.object({
    url: z.string().url().describe('Zennの記事URL'),
  }),
  outputSchema: z.object({
    title: z.string().describe('記事のタイトル'),
    content: z.string().describe('記事の本文'),
    url: z.string().describe('記事のURL'),
    publishedAt: z.string().optional().describe('公開日'),
    author: z.string().optional().describe('著者名'),
  }),
  execute: async ({ context }) => {
    const { url } = context;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Zenn記事の構造に基づいてデータを抽出
      const title = $('h1').first().text().trim() || 
                   $('title').text().replace(' | Zenn', '').trim();
      
      // 記事本文を取得 (Zennの記事構造に合わせて調整)
      let content = '';
      $('.znc').each((_, element) => {
        content += $(element).text() + '\n';
      });
      
      // 代替として、article要素から取得
      if (!content) {
        $('article').each((_, element) => {
          content += $(element).text() + '\n';
        });
      }
      
      // さらに代替として、メインコンテンツエリアから取得
      if (!content) {
        $('.View_main__ScoZh').each((_, element) => {
          content += $(element).text() + '\n';
        });
      }
      
      // 著者名を取得（複数のセレクタを試行）
      const author = $('a[href*="/"] span').first().text().trim() ||
                    $('.UserLink_userName__zUSwu').first().text().trim() ||
                    $('[data-testid="author-name"]').text().trim() ||
                    $('header a[href^="/"]').first().text().trim() ||
                    $('[class*="userName"]').first().text().trim() ||
                    $('[class*="UserName"]').first().text().trim() ||
                    $('[class*="author"]').first().text().trim();
      
      const publishedAt = $('time').first().attr('datetime') ||
                         $('.PublishedAt_container__UgXhb time').attr('datetime');
      
      if (!content) {
        throw new Error('記事の内容を取得できませんでした');
      }
      
      return {
        title,
        content: content.trim(),
        url,
        publishedAt,
        author,
      };
    } catch (error) {
      throw new Error(`記事の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});