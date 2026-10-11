import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, MailPlus, RefreshCw, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

function formatDate(value) {
  if (!value) return "Never signed in";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function errorMessage(error) {
  const response = error?.context;
  if (response && typeof response.json === "function") {
    try {
      const body = await response.clone().json();
      if (body?.error) return body.error;
    } catch {
      // Fall back to the SDK's message below.
    }
  }
  return error?.message || "Assistant management is temporarily unavailable.";
}

export default function AdminAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadAssistants = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-assistants", { method: "GET" });
    if (invokeError) setError(await errorMessage(invokeError));
    else setAssistants(Array.isArray(data?.assistants) ? data.assistants : []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadAssistants(); }, [loadAssistants]);

  async function inviteAssistant(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-assistants", {
      method: "POST",
      body: { name: name.trim(), email: email.trim() },
    });
    if (invokeError) {
      setError(await errorMessage(invokeError));
    } else if (data?.invited || data?.enabledExisting || data?.alreadyAssistant) {
      setSuccess(data.alreadyAssistant
        ? `${data.email} already has assistant access.`
        : data.enabledExisting
          ? `${data.email} already had an account. Assistant access is enabled; they can sign in with their existing password.`
          : `Invitation sent to ${data.email}. They can set a password from the email link.`);
      setName("");
      setEmail("");
      await loadAssistants(true);
    } else {
      setError(data?.error || "The invitation could not be sent.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" aria-label="Back to admin" className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 transition hover:border-[#ff1f8f] hover:text-[#ff1f8f]"><ArrowLeft className="h-5 w-5" /></Link>
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff1f8f]">Admin management</p><h1 className="font-heading text-2xl font-bold">Assistants</h1><p className="text-sm text-black/45">Invite staff and review their most recent sign-in.</p></div>
          </div>
          <Users className="h-6 w-6 text-[#ff1f8f]" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
        <section className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5"><h2 className="font-heading text-xl font-bold">Create an assistant login</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">Send an invitation to their email. They set their own password from the invitation link. Assistants can view orders and customer messages, but can’t edit store settings or records.</p></div>
          <form onSubmit={inviteAssistant} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-sm font-medium text-black/70">Assistant name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="admin-input mt-2 w-full" /></label>
            <label className="block text-sm font-medium text-black/70">Email address<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="admin-input mt-2 w-full" /></label>
            <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff1f8f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e60078] disabled:cursor-not-allowed disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}{saving ? "Sending…" : "Send invitation"}</button>
          </form>
          {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-6 py-5">
            <div><h2 className="font-heading text-xl font-bold">Staff accounts</h2><p className="mt-1 text-sm text-black/45">Last sign-in time comes from Supabase Auth.</p></div>
            <button type="button" onClick={() => void loadAssistants(true)} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold hover:border-[#ff1f8f] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
          </div>
          {loading ? <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-[#ff1f8f]" /></div> : assistants.length ? <div className="divide-y divide-black/[0.06]">
            {assistants.map((assistant) => <div key={assistant.id} className="grid gap-3 px-6 py-5 md:grid-cols-[1fr_1fr_auto] md:items-center">
              <div><p className="font-semibold">{assistant.name || "Assistant"}</p><p className="mt-1 text-sm text-black/50">{assistant.email}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-black/35">Last sign-in</p><p className="mt-1 text-sm text-black/70">{formatDate(assistant.last_sign_in_at)}</p></div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${assistant.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><Shield className="h-3.5 w-3.5" />{assistant.invited ? "Invitation pending" : assistant.active ? "Active" : "Inactive"}</span>
            </div>)}
          </div> : <div className="px-6 py-12 text-center text-sm text-black/45">No assistant accounts yet.</div>}
          {!loading && error && !assistants.length && <p role="alert" className="px-6 pb-5 text-sm text-red-700">{error}</p>}
        </section>
      </main>
    </div>
  );
}
