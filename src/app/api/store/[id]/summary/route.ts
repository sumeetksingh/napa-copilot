import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const categories = [
    { name: "Brake Pads", pct: 0.15 },
    { name: "Filters", pct: 0.10 },
    { name: "Batteries", pct: 0.12 },
    { name: "Rotors", pct: 0.08 },
    { name: "Other", pct: 0.55 },
  ];
  return NextResponse.json({
    storeId: params.id,
    asOf: new Date().toISOString().slice(0,10),
    totals: { onHand: 128450, skuCount: 8421 },
    categories,
  });
}
