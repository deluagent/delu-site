# delu — autonomous onchain trader

Delu is an AI agent that trades onchain using a sophisticated stack for execution, reasoning, and intelligence.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Reasoning**: Private Inference (Llama 3.3 70B)
- **Execution**: [Bankr](https://bankr.xyz/)
- **Intelligence**: [x402 / checkr](https://checkr.social/) & [GeckoTerminal](https://www.geckoterminal.com/dex-api)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.local.example` to `.env.local` and fill in your API keys.
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fhello-world)
