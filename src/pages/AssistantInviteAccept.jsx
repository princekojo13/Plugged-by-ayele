import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

export default function AssistantInviteAccept() {
  const navigate = useNavigate();
  const { user, isAssistant, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAssistant) setError("This invitation link is not for an assistant account.");
  }, [authLoading, user, isAssistant]);

  async function setNewPassword(event) {
    event.preventDefault();
    setError("");
    if (password.length < 10) {
      setError("Use at least 10 characters for the password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Could not set your password.");
      setSaving(false);
      return;
    }
    setSuccess(true);
    window.setTimeout(() => navigate("/assistant", { replace: true }), 800);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-6 text-center"><span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck className="h-7 w-7" /></span><h1 className="text-2xl font-bold">Finish your assistant login</h1><p className="mt-2 text-sm text-slate-400">{user?.email || "Plugged by Ayeley"}</p></div>
        {authLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : !user ? <p className="rounded-xl bg-amber-400/10 p-4 text-sm text-amber-100">This invitation is no longer active. Open the newest invitation email or ask the administrator to send another one.</p> : success ? <p role="status" className="rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">Password saved. Opening your assistant workspace…</p> : <form onSubmit={setNewPassword} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">New password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-white outline-none focus:border-white/30" /></div></label>
          <label className="block text-sm font-medium text-slate-200">Confirm password<input type="password" required minLength={10} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/30" /></label>
          {error && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={saving || !isAssistant} className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black hover:bg-slate-200 disabled:opacity-50">{saving ? "Saving…" : "Set password"}</button>
        </form>}
      </section>
    </main>
  );
}
