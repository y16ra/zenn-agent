import { Mastra } from '@mastra/core';
import { zennSummarizerAgent } from '../agents/zenn-summarizer';

export const mastra = new Mastra({
  agents: {
    zennSummarizerAgent,
  },
});

export type MastraInstance = typeof mastra;