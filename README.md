# Perplexity Clone

A high-tech AI-powered search interface with a sophisticated data analytics aesthetic.

## Live Demo

Find the live deployment link on Vercel in the **top right corner** of this repository page.

## Setup

**Important:** This project uses **Bun** as the package manager and runtime. Do not use npm, yarn, or pnpm.

### Prerequisites

Install Bun if you haven't already:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hp_perplexity
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your API keys.

4. Run the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

To create a production build:
```bash
bun run build
```

To start the production server:
```bash
bun run start
```
