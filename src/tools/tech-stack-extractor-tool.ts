import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const techStackExtractorTool = createTool({
  id: 'tech-stack-extractor',
  description: '記事内容から使用されている技術スタック（プログラミング言語、フレームワーク、ツール等）を抽出します',
  inputSchema: z.object({
    content: z.string().describe('記事の本文内容'),
    title: z.string().optional().describe('記事のタイトル'),
  }),
  outputSchema: z.object({
    languages: z.array(z.string()).describe('プログラミング言語'),
    frameworks: z.array(z.string()).describe('フレームワーク'),
    libraries: z.array(z.string()).describe('ライブラリ'),
    tools: z.array(z.string()).describe('開発ツール'),
    databases: z.array(z.string()).describe('データベース'),
    infrastructure: z.array(z.string()).describe('インフラ・クラウドサービス'),
    platforms: z.array(z.string()).describe('プラットフォーム'),
    confidence: z.number().min(0).max(1).describe('抽出結果の信頼度'),
  }),
  execute: async ({ context }) => {
    const { content, title = '' } = context;
    
    // 解析対象のテキスト（タイトル + 本文）
    const fullText = (title + ' ' + content).toLowerCase();
    
    // 技術スタック辞書
    const techDictionary = {
      languages: [
        'javascript', 'typescript', 'python', 'java', 'php', 'ruby', 'go', 'rust',
        'c++', 'c#', 'swift', 'kotlin', 'dart', 'scala', 'elixir', 'clojure',
        'haskell', 'lua', 'perl', 'shell', 'bash', 'powershell', 'r', 'matlab',
        'sql', 'html', 'css', 'sass', 'scss', 'less'
      ],
      frameworks: [
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'remix',
        'express', 'fastify', 'koa', 'nestjs', 'django', 'flask', 'fastapi',
        'rails', 'laravel', 'symfony', 'spring', 'spring boot', 'gin', 'echo',
        'actix', 'rocket', 'phoenix', 'ember', 'backbone', 'jquery', 'bootstrap',
        'tailwind', 'bulma', 'chakra ui', 'material-ui', 'ant design', 'vuetify'
      ],
      libraries: [
        'redux', 'mobx', 'zustand', 'recoil', 'apollo', 'relay', 'graphql',
        'axios', 'fetch', 'prisma', 'typeorm', 'sequelize', 'mongoose', 'knex',
        'lodash', 'ramda', 'moment', 'dayjs', 'date-fns', 'joi', 'yup', 'zod',
        'jest', 'mocha', 'chai', 'cypress', 'playwright', 'puppeteer', 'selenium',
        'webpack', 'vite', 'rollup', 'parcel', 'babel', 'typescript', 'eslint',
        'prettier', 'husky', 'lint-staged'
      ],
      tools: [
        'git', 'github', 'gitlab', 'bitbucket', 'vscode', 'vim', 'emacs',
        'intellij', 'webstorm', 'sublime', 'atom', 'figma', 'sketch', 'adobe xd',
        'postman', 'insomnia', 'swagger', 'storybook', 'chromatic', 'sentry',
        'datadog', 'newrelic', 'grafana', 'prometheus', 'elk', 'splunk',
        'sonarqube', 'codecov', 'browserstack', 'sauce labs'
      ],
      databases: [
        'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'firestore', 'supabase', 'planetscale',
        'fauna', 'neo4j', 'influxdb', 'clickhouse', 'snowflake', 'bigquery'
      ],
      infrastructure: [
        'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'cloudflare',
        'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions',
        'gitlab ci', 'circle ci', 'travis ci', 'nginx', 'apache', 'load balancer',
        'cdn', 'lambda', 'cloud functions', 'cloud run', 'ecs', 'fargate'
      ],
      platforms: [
        'ios', 'android', 'react native', 'flutter', 'ionic', 'xamarin',
        'electron', 'tauri', 'pwa', 'chrome extension', 'firefox addon',
        'slack app', 'discord bot', 'telegram bot', 'line bot', 'chatbot'
      ]
    };
    
    // 抽出ロジック
    const extractTechnologies = (category: keyof typeof techDictionary): string[] => {
      const found = new Set<string>();
      const technologies = techDictionary[category];
      
      for (const tech of technologies) {
        // 正規表現の特殊文字をエスケープ
        const escapedTech = tech.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 完全一致または単語境界での一致を検索
        const patterns = [
          new RegExp(`\\b${escapedTech}\\b`, 'g'),
          new RegExp(`${escapedTech.replace(/[.\s]/g, '[.\\s]')}`, 'g'),
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(fullText)) {
            // 元の大文字小文字を保持した名前を追加
            found.add(tech);
            break;
          }
        }
      }
      
      return Array.from(found).sort();
    };
    
    const languages = extractTechnologies('languages');
    const frameworks = extractTechnologies('frameworks');
    const libraries = extractTechnologies('libraries');
    const tools = extractTechnologies('tools');
    const databases = extractTechnologies('databases');
    const infrastructure = extractTechnologies('infrastructure');
    const platforms = extractTechnologies('platforms');
    
    // 信頼度計算（見つかった技術の数と内容の長さに基づく）
    const totalFound = languages.length + frameworks.length + libraries.length + 
                      tools.length + databases.length + infrastructure.length + platforms.length;
    const contentLength = fullText.length;
    const confidence = Math.min(totalFound / 10 + Math.min(contentLength / 5000, 0.3), 1);
    
    return {
      languages,
      frameworks,
      libraries,
      tools,
      databases,
      infrastructure,
      platforms,
      confidence: Number(confidence.toFixed(2)),
    };
  },
});