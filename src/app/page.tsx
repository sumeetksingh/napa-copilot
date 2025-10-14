import Link from "next/link";
export default function Home(){ return (
  <main className="p-10 text-white bg-black h-screen">
    <h1 className="text-2xl mb-4">NAPA Copilot</h1>
    <Link className="underline text-sky-300" href="/pulse">Open Pulse Prototype →</Link>
  </main>
);}
