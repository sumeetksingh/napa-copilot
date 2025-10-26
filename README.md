# NAPA Copilot (Prototype)

Futuristic 3D store + chat/voice UI to explore store inventory mixes.

**Tech:** Next.js 15 (App Router), React 18, Three.js (react-three-fiber/drei), Tailwind, Zustand, Recharts.
<<<<<<< HEAD
=======

---

## Quick Start
>>>>>>> 4a6bca1 (feat: add voice-enabled agent workflow)

## Quick Start
```bash
<<<<<<< HEAD
git clone https://github.com/sumeetksingh/napa-copilot.git
cd napa-copilot
nvm use || nvm install
npm install
echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" > .env.local
npm run dev  # open http://localhost:3000/pulse
```

# Prerequisites

Node.js 20.x (see .nvmrc)

Git, VS Code

macOS/Windows/Linux (macOS: xcode-select --install once)

# Scripts

npm run dev – start dev server

npm run build – production build

npm start – run production build

npm run lint – lint project

# Project Layout
src/
  app/
    pulse/page.tsx
    api/store/[id]/summary/route.ts
    api/store/[id]/tiles/route.ts
    globals.css  layout.tsx
  components/
    Scene.tsx  NapaStoreFront.tsx  StackedBars3D.tsx
    CategoryMixDonut.tsx  InventoryTiles.tsx
    Hud.tsx  Legend.tsx  ChatPanel.tsx
    icons/Mic.tsx
  lib/
    colors.ts  emoji.ts  useStore.ts
public/
  textures/ (optional)

# Tailwind / PostCSS (Next 15)

Ensure postcss.config.js uses @tailwindcss/postcss.
If you see an error:

npm i -D @tailwindcss/postcss

# Troubleshooting

White left panel → wrap chat column with bg-[#05080f] rounded-2xl ring-1 ring-[#163162].

# PostCSS error →

module.exports = { plugins: { "@tailwindcss/postcss": {}, autoprefixer: {} } }


Type errors → npm run build to see details.
=======
# 1) Clone
git clone https://github.com/<your-org-or-user>/napa-copilot.git
cd napa-copilot

# 2) Use Node 20 (recommended)
nvm use || nvm install

# 3) Install
npm install

# 4) Env
cp .env.local.example .env.local

#    - set `NEXT_PUBLIC_AGENT_FEED=/api/agent/live` to use the LLM-backed agent (defaults to mock feed)
#    - add `OPENAI_API_KEY=<your key>` (and optionally `OPENAI_AGENT_MODEL`) when enabling the live agent
#    - optional voice playback: set `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE` to enable spoken summaries

# 5) Run
npm run dev
# open http://localhost:3000/pulse
>>>>>>> 4a6bca1 (feat: add voice-enabled agent workflow)
