import { getDb } from "../../../db";
import { expenses } from "../../../db/schema";
import { env } from "cloudflare:workers";
const categories = new Set(["Food & Drink", "Groceries", "Transport", "Shopping", "Beauty & Self-care", "Entertainment", "Travel", "Bills", "Health", "Education", "Gifts & Donations", "Other", "Review later"]);
type Capture = { id?: string; spentAt?: string; merchant?: string; amountPence?: number; amount?: string | number; category?: string; source?: string; record?: string };
export async function POST(request: Request) {
  const token = (env.CAPTURE_TOKEN ?? "").trim();
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const input = await request.json() as Capture;
  if (input.record) {
    const field = (name: string) => input.record?.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim();
    const amount = field("Amount")?.replace(/[^0-9.]/g, "");
    input.spentAt = field("Time"); input.merchant = field("Merchant"); input.category = field("Category"); input.source = field("Source"); input.amountPence = amount ? Math.round(Number(amount) * 100) : undefined;
  }
  if (input.amountPence === undefined && input.amount !== undefined) {
    const amount = String(input.amount).replace(/[^0-9.]/g, "");
    input.amountPence = amount ? Math.round(Number(amount) * 100) : undefined;
  }
  const merchant = input.merchant?.trim() ?? "";
  if (!merchant || merchant.length > 100 || !Number.isInteger(input.amountPence) || !input.amountPence || input.amountPence! < 0 || Number.isNaN(Date.parse(input.spentAt ?? "")) || !categories.has(input.category ?? "")) return Response.json({ error: "Invalid expense data." }, { status: 400 });
  const id = input.id ?? crypto.randomUUID();
  const [expense] = await getDb().insert(expenses).values({ id, spentAt: input.spentAt!, merchant, amountPence: input.amountPence!, category: input.category!, source: input.source?.trim() || "Unknown" }).onConflictDoNothing().returning();
  return Response.json({ saved: Boolean(expense), id }, { status: expense ? 201 : 200 });
}
