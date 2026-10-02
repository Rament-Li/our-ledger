"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, CreditCard, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["Food & Drink", "Groceries", "Transport", "Shopping", "Beauty & Self-care", "Entertainment", "Travel", "Bills", "Health", "Education", "Gifts & Donations", "Other", "Review later"];
const colours = ["#15616d", "#f4a261", "#e76f51", "#2a9d8f", "#8ab17d", "#6d597a", "#457b9d", "#bc6c25"];

type Expense = { id: string; spentAt: string; merchant: string; amountPence: number; currency: string; category: string; note: string; source: string };
type Form = { id?: string; spentAt: string; merchant: string; amount: string; category: string; note: string; source: string };

function localInputDate(value = new Date()) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
function toInputDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 16) : localInputDate(date);
}
function money(pence: number) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100); }
function prettyDate(value: string) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function cleanAmount(value: string) { return Number.parseFloat(value.replace(/[^0-9.]/g, "")); }
function emptyForm(): Form { return { spentAt: localInputDate(), merchant: "", amount: "", category: "Food & Drink", note: "", source: "Manual" }; }

export function LedgerClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/expenses", { cache: "no-store" });
    const body = await response.json() as { expenses: Expense[]; error?: string };
    if (!response.ok) setError(body.error ?? "Could not load your shared ledger.");
    else { setExpenses(body.expenses); setError(""); }
    setLoading(false);
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((expense) => expense.spentAt.slice(0, 7) === thisMonth);
  const total = monthExpenses.reduce((sum, expense) => sum + expense.amountPence, 0);
  const byCategory = Object.entries(monthExpenses.reduce<Record<string, number>>((sum, expense) => { sum[expense.category] = (sum[expense.category] ?? 0) + expense.amountPence; return sum; }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const highest = byCategory[0];

  function beginNew() { setForm(emptyForm()); setError(""); setDialogOpen(true); }
  function beginEdit(expense: Expense) { setForm({ id: expense.id, spentAt: toInputDate(expense.spentAt), merchant: expense.merchant, amount: (expense.amountPence / 100).toFixed(2), category: expense.category, note: expense.note, source: expense.source }); setError(""); setDialogOpen(true); }
  async function save() {
    const amount = cleanAmount(form.amount);
    if (!form.merchant.trim() || !Number.isFinite(amount) || amount <= 0) { setError("Add a merchant and a valid amount."); return; }
    setSaving(true);
    const payload = { ...form, amountPence: Math.round(amount * 100), spentAt: new Date(form.spentAt).toISOString() };
    const response = await fetch("/api/expenses", { method: form.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) { setError(body.error ?? "Could not save this expense."); return; }
    setDialogOpen(false); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this expense from your shared ledger?")) return;
    const response = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json() as { error?: string }; setError(body.error ?? "Could not delete this expense."); return; }
    await load();
  }

  return <main className="min-h-screen bg-[#f7f7f2] text-[#17302d]">
    <header className="border-b border-[#dfe7df] bg-[#fbfcf8]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#15616d] text-white"><ReceiptText size={20} /></span><div><p className="font-semibold">Shared spending</p><p className="text-xs text-[#6b807a]">You & your partner</p></div></div>
        <Button className="rounded-xl bg-[#15616d] hover:bg-[#0f505a]" onClick={beginNew}><Plus size={17} /> Add expense</Button>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm font-medium text-[#6b807a]">{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date())}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your shared month, clearly.</h1></div><p className="max-w-xs text-sm leading-6 text-[#6b807a]">Every expense you both add or capture from your cards appears in this one shared ledger.</p></div>
      {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Spent this month" value={money(total)} detail={`${monthExpenses.length} recorded expense${monthExpenses.length === 1 ? "" : "s"}`} /><Metric label="Largest category" value={highest?.name ?? "—"} detail={highest ? money(highest.value) : "Add your first expense"} /><Metric label="Shared ledger" value="Private" detail="Only invited people can view it" /></div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl border border-[#dfe7df] bg-white p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Recent expenses</h2><p className="mt-1 text-sm text-[#6b807a]">Edit or remove anything that needs correcting.</p></div><CreditCard size={20} className="text-[#6b807a]" /></div>
          {loading ? <p className="py-16 text-center text-sm text-[#6b807a]">Loading the shared ledger…</p> : expenses.length === 0 ? <div className="rounded-2xl border border-dashed border-[#c9d8cf] bg-[#f7faf6] px-6 py-14 text-center"><p className="font-medium">Your joint ledger is ready.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6b807a]">Add a manual expense now. Your Bank A and Bank B shortcuts will connect here next.</p><Button variant="outline" className="mt-5 rounded-xl" onClick={beginNew}>Add first expense</Button></div> : <div className="divide-y divide-[#edf0eb]">{expenses.slice(0, 12).map((expense) => <article key={expense.id} className="flex items-center gap-3 py-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e6f0ed] text-sm font-semibold text-[#15616d]">{expense.merchant.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{expense.merchant}</p><p className="mt-0.5 text-xs text-[#6b807a]">{prettyDate(expense.spentAt)} · {expense.category} · {expense.source}</p></div><p className="font-semibold tabular-nums">{money(expense.amountPence)}</p><button aria-label={`Edit ${expense.merchant}`} className="rounded-lg p-2 text-[#6b807a] hover:bg-[#edf4f0]" onClick={() => beginEdit(expense)}><Pencil size={16} /></button><button aria-label={`Delete ${expense.merchant}`} className="rounded-lg p-2 text-[#9f4e48] hover:bg-red-50" onClick={() => void remove(expense.id)}><Trash2 size={16} /></button></article>)}</div>}
        </section>
        <aside className="rounded-3xl border border-[#dfe7df] bg-[#eaf3ee] p-5 sm:p-7"><h2 className="text-lg font-semibold">Where it went</h2><p className="mt-1 text-sm text-[#6b807a]">This month by category</p>{byCategory.length === 0 ? <div className="flex h-64 items-center justify-center text-center text-sm text-[#6b807a]">Your category picture will appear here once you add expenses.</div> : <><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byCategory} dataKey="value" innerRadius={52} outerRadius={76} paddingAngle={3}>{byCategory.map((item, index) => <Cell key={item.name} fill={colours[index % colours.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer></div><div className="space-y-3">{byCategory.slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colours[index % colours.length] }} /> <span className="truncate">{item.name}</span></span><span className="font-medium tabular-nums">{money(item.value)}</span></div>)}</div></>}</aside>
      </div>
      <section className="mt-7 flex items-center gap-3 rounded-2xl border border-[#dfe7df] bg-white px-5 py-4 text-sm text-[#526861]"><Check size={17} className="shrink-0 text-[#15616d]" /><span>Private shared space. No card numbers, account numbers, notification text, or bank balances are stored here.</span><ChevronRight size={17} className="ml-auto shrink-0" /></section>
    </section>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{form.id ? "Edit expense" : "Add an expense"}</DialogTitle><DialogDescription>Use this for cash, bills, transfers, or anything not captured by your Shortcut.</DialogDescription></DialogHeader><div className="grid gap-4 py-3"><div className="grid gap-2"><Label htmlFor="merchant">Merchant or description</Label><Input id="merchant" placeholder="e.g. Starbucks" value={form.merchant} onChange={(event) => setForm({ ...form, merchant: event.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="amount">Amount (£)</Label><Input id="amount" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="spentAt">Date & time</Label><Input id="spentAt" type="datetime-local" value={form.spentAt} onChange={(event) => setForm({ ...form, spentAt: event.target.value })} /></div></div><div className="grid gap-2"><Label>Category</Label><Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Source</Label><Select value={form.source} onValueChange={(source) => setForm({ ...form, source })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Manual">Manual</SelectItem><SelectItem value="Bank A">Bank A</SelectItem><SelectItem value="Bank B">Bank B</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="note">Note (optional)</Label><Input id="note" placeholder="e.g. waiting for refund" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button className="bg-[#15616d] hover:bg-[#0f505a]" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save expense"}</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <section className="rounded-2xl border border-[#dfe7df] bg-white p-5"><p className="text-sm text-[#6b807a]">{label}</p><p className="mt-3 truncate text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-[#6b807a]">{detail}</p></section>; }
