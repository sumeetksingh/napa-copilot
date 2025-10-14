# NAPA Copilot (Prototype)

Futuristic 3D store + chat/voice UI to explore store inventory mixes.

**Tech:** Next.js 15 (App Router), React 18, Three.js (react-three-fiber/drei), Tailwind, Zustand, Recharts.

## Quick Start
```bash
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
