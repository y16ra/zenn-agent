# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Zenn article summarization agent built with the Mastra framework and OpenAI GPT-4. The agent scrapes Zenn articles and generates structured Japanese summaries.

## Commands

### Development
- `npm run dev <Zenn記事URL>` - Run the agent in development mode with a Zenn article URL
- `npm run build` - Build the TypeScript project
- `npm start <Zenn記事URL>` - Run the built project

### Example Usage
```bash
npm run dev https://zenn.dev/example/articles/example-article
```

## Architecture

### Core Components

**Mastra Framework Integration**:
- Uses `@mastra/core` for agent orchestration
- Tools created with `createTool` from `@mastra/core/tools`
- Agents use `openai('gpt-4o-mini')` model configuration
- Main Mastra instance configured in `src/mastra/index.ts`

**Agent-Tool Pattern**:
- `zennSummarizerAgent` (in `src/agents/`) orchestrates the summarization process
- `zennScraperTool` (in `src/tools/`) handles web scraping of Zenn articles
- Agent calls tool automatically based on user input containing Zenn URLs

**Data Flow**:
1. User provides Zenn article URL via command line
2. Agent receives URL and determines to use the scraper tool
3. Scraper tool fetches article content using axios and cheerio
4. Agent processes content and generates structured Japanese summary

### Key Implementation Details

**Web Scraping Strategy**:
- Uses multiple CSS selectors to handle different Zenn page layouts
- Fallback chain: `.znc` → `article` → `.View_main__ScoZh`
- Extracts title, content, author, and publication date

**Agent Instructions**:
- Produces structured output with specific Japanese formatting
- Includes sections for main points, technical content, implementation details, caveats, and target audience
- Uses emojis for section headers (📝, 🎯, 💡, 🚀, ⚠️, 👥)

## Environment Setup

Requires `OPENAI_API_KEY` environment variable in `.env` file.

## Dependencies

- `@mastra/core` - Main framework
- `@ai-sdk/openai` - OpenAI model integration  
- `axios` - HTTP requests for scraping
- `cheerio` - HTML parsing
- `zod` - Schema validation