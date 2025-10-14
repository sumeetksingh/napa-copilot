import Scene from "@/components/Scene";
import Hud from "@/components/Hud";
import ChatPanel from "@/components/ChatPanel";
import Legend from "@/components/Legend";
import CategoryMixDonut from "@/components/CategoryMixDonut";
import InventoryTiles from "@/components/InventoryTiles";

async function fetchData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const [summary] = await Promise.all([
    fetch(`${base}/api/store/ATL_012/summary`, { cache: "no-store" }).then(r=>r.json()),
  ]);
  return { summary };
}

export default async function Page() {
  const { summary } = await fetchData();

  return (
    <div className="h-[calc(100vh-2rem)] grid grid-cols-[320px_1fr] gap-3 p-4">
      {/* LEFT: Chat column with its own dark panel */}
      <div className="bg-[#05080f] rounded-2xl ring-1 ring-[#163162] overflow-hidden">
        <ChatPanel />
        {/* If you want the donut in the left column, keep it here.
            Otherwise, delete this line. */}
        {/* <div className="p-4"><CategoryMixDonut categories={summary.categories} /></div> */}
      </div>

      {/* RIGHT: Scene + right sidebar (unchanged, but add rounded to match) */}
      <div className="relative p-4 bg-[#05080f] rounded-2xl ring-1 ring-[#163162] grid grid-cols-[1fr_420px] gap-4">
        <CategoryMixDonut categories={summary.categories} />
        <Scene summary={summary} />
        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="text-white/90 text-sm">Top inventory buckets</div>
          <InventoryTiles categories={summary.categories} />
        </div>
        <div className="col-span-2 flex flex-col gap-4">
          <Hud summary={summary} />
          <Legend />
        </div>
      </div>
    </div>
  );
}
