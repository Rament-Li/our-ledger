import { desc, eq } from "drizzle-orm";
import { hasLedgerAccess } from "../../ledger-auth";
import { getDb } from "../../../db";
import { expenses } from "../../../db/schema";

export const CATEGORIES = ["Food & Drink", "Groceries", "Transport", "Shopping", "Beauty & Self-care", "Entertainment", "Travel", "Bills", "Health", "Education", "Gifts & Donations", "Other", "Review later"];
const categories = new Set(CATEGORIES);
type Input = { id?: string; spentAt?: string; merchant?: string; amountPence?: number; category?: string; note?: string; source?: string };
function validate(input: Input) {
  if (!(input.merchant?.trim()) || input.merchant!.trim().length > 100) return "Enter a merchant name.";
  if (!Number.isInteger(input.amountPence) || !input.amountPence || input.amountPence! < 0 || input.amountPence! > 10_000_000) return "Enter a valid amount.";
  if (Number.isNaN(Date.parse(input.spentAt ?? ""))) return "Enter a valid date and time.";
  if (!categories.has(input.category ?? "")) return "Choose a valid category.";
  return null;
}
async function allowed() { return hasLedgerAccess(); }
export async function GET() {
  if (!(await allowed())) return Response.json({ error: "Sign in required." }, { status: 401 });
  return Response.json({ expenses: await getDb().select().from(expenses).orderBy(desc(expenses.spentAt), desc(expenses.createdAt)) });
}
export async function POST(request: Request) {
  if (!(await allowed())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const input = await request.json() as Input; const error = validate(input);
  if (error) return Response.json({ error }, { status: 400 });
  const [expense] = await getDb().insert(expenses).values({ id: crypto.randomUUID(), spentAt: input.spentAt!, merchant: input.merchant!.trim(), amountPence: input.amountPence!, category: input.category!, note: input.note?.trim() ?? "", source: input.source ?? "manual" }).returning();
  return Response.json({ expense }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await allowed())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const input = await request.json() as Input; const error = validate(input);
  if (!input.id || error) return Response.json({ error: error ?? "Expense id is required." }, { status: 400 });
  const [expense] = await getDb().update(expenses).set({ spentAt: input.spentAt!, merchant: input.merchant!.trim(), amountPence: input.amountPence!, category: input.category!, note: input.note?.trim() ?? "", updatedAt: new Date().toISOString() }).where(eq(expenses.id, input.id)).returning();
  return expense ? Response.json({ expense }) : Response.json({ error: "Expense not found." }, { status: 404 });
}
export async function DELETE(request: Request) {
  if (!(await allowed())) return Response.json({ error: "Sign in required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Expense id is required." }, { status: 400 });
  await getDb().delete(expenses).where(eq(expenses.id, id)); return Response.json({ ok: true });
}
