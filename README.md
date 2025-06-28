# Zenn記事要約エージェント

MastraフレームワークとOpenAI GPT-4を使用して、Zennの技術記事を自動要約するエージェントです。キーワード検索と技術スタック抽出機能を搭載しています。

## 🚀 セットアップ

### 前提条件
- Node.js v20.0以上
- OpenAI APIキー

### インストール

1. 依存関係をインストール:
```bash
npm install
```

2. 環境変数を設定:
`.env`ファイルを編集してOpenAI APIキーを設定してください:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 📖 使用方法

### 記事要約の実行

#### 1. 記事URL指定での要約
```bash
npm run dev <Zenn記事URL>
```

例:
```bash
npm run dev https://zenn.dev/example/articles/example-article
```

#### 2. キーワード検索での要約
```bash
npm run dev <キーワード>
```

例:
```bash
npm run dev React
npm run dev TypeScript
npm run dev "Next.js"
```

### ビルド

```bash
npm run build
npm start <Zenn記事URL>
```

## 🔧 機能

### 主要機能
- **記事取得**: ZennのURLから記事内容を自動取得
- **キーワード検索**: 指定したキーワードで関連記事を検索
- **技術スタック抽出**: 記事内容から使用技術を自動抽出・分類
- **要約生成**: GPT-4を使用した高品質な日本語要約
- **構造化出力**: 主要ポイント、技術的内容、実装方法などを整理して表示

### 出力形式
生成される要約には以下の情報が含まれます：
- 📝 記事の基本情報（タイトル、著者、公開日、URL）
- 🎯 主要なポイント（要点を箇条書き）
- 🛠️ 使用技術スタック（言語、フレームワーク、ライブラリ、ツール、DB、インフラ）
- 💡 技術的な内容（詳細な技術解説）
- 🚀 実装・解決策（具体的な実装方法）
- ⚠️ 注意点・課題（注意すべき点）
- 👥 対象読者（適用対象者）

## 📁 プロジェクト構造

```
src/
├── agents/
│   └── zenn-summarizer.ts              # 要約エージェント
├── tools/
│   ├── zenn-scraper.ts                 # Zenn記事取得ツール
│   ├── zenn-search-tool.ts             # Zenn検索ツール
│   └── tech-stack-extractor-tool.ts    # 技術スタック抽出ツール
├── mastra/
│   └── index.ts                        # Mastraインスタンス
└── index.ts                            # エントリーポイント
```

## 🤖 エージェントの動作

### 記事URL要約の場合
1. Zenn記事URLを受け取る
2. Webスクレイピングで記事内容を取得
3. 記事内容から技術スタックを自動抽出
4. GPT-4で記事を分析・要約
5. 技術スタック情報を含む構造化された日本語要約を出力

### キーワード検索の場合
1. 検索キーワードを受け取る
2. Zennで関連記事を検索
3. 検索結果から上位記事を選択
4. 各記事の内容を取得し技術スタックを抽出
5. GPT-4で記事を分析・要約
6. 複数記事の要約結果を出力

## 🛠️ カスタマイズ

### 要約形式の変更
`src/agents/zenn-summarizer.ts`の`instructions`部分を編集して、要約の形式や内容をカスタマイズできます。

### 技術スタック辞書の拡張
`src/tools/tech-stack-extractor-tool.ts`の`techDictionary`を編集して、認識する技術要素を追加・変更できます。

### 検索設定の調整
`src/tools/zenn-search-tool.ts`の検索パラメータ（取得件数制限など）をカスタマイズできます。

### 他のAIモデルの使用
`model`設定を変更することで、他のAIモデルを使用できます。

## 🔧 Mastra開発環境

### ローカル開発の開始

Mastraフレームワークを使用したローカル開発環境の特徴：

#### 開発モード
```bash
# 通常の実行
npm run dev <Zenn記事URL>

# Mastra開発サーバー（推奨）
npx mastra dev
```

#### `mastra dev`コマンドの特徴

`mastra dev`は包括的なローカル開発環境を提供します（`http://localhost:4111`で起動）：

**インタラクティブプレイグラウンド**
- **エージェントプレイグラウンド**: チャットインターフェースでエージェントをテスト
- **ワークフロープレイグラウンド**: ワークフローグラフの可視化と実行
- **ツールプレイグラウンド**: 個別ツールの分離テスト

**開発支援機能**
- 詳細な実行トレースとログ表示
- A/Bテストとプロンプトバージョニング
- REST API エンドポイントの自動生成
- OpenAPI仕様とSwagger UIの提供
- モデル設定の動的調整（temperature、top P等）

**デバッグ機能**
- ステップバイステップの実行ログ
- 状態変化とデシジョンポイントのトレース
- パフォーマンス監視と実行時間測定

#### 実際の開発フロー

1. **開発サーバーの起動**
```bash
npx mastra dev
```

2. **ブラウザでアクセス**: `http://localhost:4111`

3. **エージェントのテスト**
- エージェントプレイグラウンドで`zennSummarizerAgent`を選択
- チャット形式でZenn記事URLまたはキーワードを入力してテスト
- 実行トレースで動作を詳細確認

4. **ツールの個別テスト**
- ツールプレイグラウンドで各ツールを選択：
  - `zennScraperTool`: 記事URLでスクレイピング結果を確認
  - `zennSearchTool`: キーワードで検索結果を確認
  - `techStackExtractorTool`: 記事内容で技術スタック抽出を確認
- パフォーマンスと出力形式を検証

#### Mastraフレームワークの特徴

**エージェント指向アーキテクチャ**
- `@mastra/core/agent`を使用してエージェントを定義
- エージェントは明確な役割と指示を持つ
- 複数のツールを組み合わせて複雑なタスクを実行

**ツール統合システム**
- `createTool`でカスタムツールを作成
- Zodスキーマによる入出力の型安全性
- エージェントに必要なツールを柔軟に組み込み

**LLMプロバイダー統合**
- `@ai-sdk/openai`を使用したOpenAI統合
- モデル設定の柔軟性（GPT-4o-mini使用）
- 環境変数による安全なAPIキー管理

**開発時の利点**
- TypeScriptによる型安全性
- ホットリロード対応（tsx使用）
- 構造化されたエラーハンドリング
- 環境変数の自動読み込み

#### 開発ワークフロー

1. **エージェント設計**: `src/agents/`でエージェントの役割と指示を定義
2. **ツール開発**: `src/tools/`でカスタムツールを実装
3. **統合**: `src/mastra/index.ts`でエージェントとツールを統合
4. **テスト**: `npm run dev`でローカル実行・検証

#### カスタマイズポイント

**エージェントの指示変更**
```typescript
// src/agents/zenn-summarizer.ts
instructions: `
  要約の形式や内容をカスタマイズ
`
```

**新しいツールの追加**
```typescript
// src/tools/new-tool.ts
export const newTool = createTool({
  id: 'newTool',
  // ツールの実装
});
```

**モデル設定の変更**
```typescript
// 他のモデルプロバイダーへの切り替え
model: anthropic('claude-3-haiku-20240307'),
```

## 🔒 注意事項

- OpenAI APIキーは`.env`ファイルで管理し、Gitにコミットしないでください
- 記事のスクレイピングは適切な間隔で行い、サーバーに過度な負荷をかけないでください
- 要約結果は参考程度に留め、重要な内容は原文を確認してください