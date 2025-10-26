import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "src", "data");

const stores = JSON.parse(fs.readFileSync(path.join(dataDir, "network-stores.json"), "utf8"));
const actions = JSON.parse(fs.readFileSync(path.join(dataDir, "network-actions.json"), "utf8"));
const storeTotals = JSON.parse(fs.readFileSync(path.join(dataDir, "store-totals.json"), "utf8"));
const categoriesTemplate = JSON.parse(fs.readFileSync(path.join(dataDir, "store-categories.json"), "utf8"));
const skuTemplate = JSON.parse(fs.readFileSync(path.join(dataDir, "store-sku-performance.json"), "utf8"));

const OUTPUT_DIR = path.join(process.cwd(), "reports");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "pulse-store-network.xlsx");

function computeInventoryHealth(capacityPct) {
  const delta = Math.abs(capacityPct - 1);
  const score = Math.round(100 - delta * 500);
  return Math.max(0, Math.min(100, score));
}

function formatPercent(value) {
  return Math.round(value * 100);
}

const workbook = XLSX.utils.book_new();
const generatedAt = new Date().toISOString();

const summaryRows = stores.map((store) => {
  const totals = storeTotals[store.id] ?? { onHand: 0, skuCount: 0, capacityPct: store.capacityPct };
  const storeActions = actions.filter((action) => action.storeId === store.id).map((action) => action.title).join("; ");
  const inventoryHealth = computeInventoryHealth(totals.capacityPct ?? store.capacityPct);
  return {
    "Store ID": store.id,
    "Store Name": store.name,
    Region: store.region,
    Status: store.status,
    "Capacity %": formatPercent(totals.capacityPct ?? store.capacityPct),
    "Inventory Health": inventoryHealth,
    "On Hand Units": totals.onHand,
    "Active SKUs": totals.skuCount,
    "Returns Pending": store.returnsPending,
    "Open Actions": storeActions || "None",
  };
});

const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
XLSX.utils.book_append_sheet(workbook, summarySheet, "Store Summary");

const categoryRows = [];
for (const store of stores) {
  const totals = storeTotals[store.id] ?? { capacityPct: store.capacityPct };
  for (const category of categoriesTemplate) {
    categoryRows.push({
      "Store ID": store.id,
      Region: store.region,
      Category: category.name,
      "Mix %": formatPercent(category.pct),
      "Store Capacity %": formatPercent(totals.capacityPct ?? store.capacityPct),
      "Over Capacity": (totals.capacityPct ?? store.capacityPct) > 1 ? "Yes" : "No",
    });
  }
}

const categoriesSheet = XLSX.utils.json_to_sheet(categoryRows);
XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Category Mix");

const skuRows = [];
for (const store of stores) {
  for (const sku of skuTemplate) {
    skuRows.push({
      "Store ID": store.id,
      "SKU ID": sku.id,
      "SKU Name": sku.name,
      Category: sku.category,
      "On Hand": sku.onHand,
      "Weekly Sales": sku.weeklySales,
      "Capacity %": formatPercent(sku.capacityPct),
      "Risk Reason": sku.reason,
      Ranking: sku.ranking,
    });
  }
}

const skuSheet = XLSX.utils.json_to_sheet(skuRows);
XLSX.utils.book_append_sheet(workbook, skuSheet, "Mock SKU Watchlist");

const actionsSheet = XLSX.utils.json_to_sheet(
  actions.map((action) => ({
    "Action ID": action.id,
    "Store ID": action.storeId,
    Title: action.title,
    Detail: action.detail,
    Type: action.type,
    Urgency: action.urgency,
  })),
);
XLSX.utils.book_append_sheet(workbook, actionsSheet, "Open Actions");

const metadataSheet = XLSX.utils.aoa_to_sheet([
  ["Pulse Store Network Snapshot"],
  ["Generated At", generatedAt],
  ["Total Stores", stores.length],
  ["Source Files", "src/data/*.json"],
  ["Notes", "Inventory health score is derived from capacity variance (100 is optimal)."],
]);
XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
XLSX.writeFile(workbook, OUTPUT_PATH);

console.log(`Workbook written to ${OUTPUT_PATH}`);
