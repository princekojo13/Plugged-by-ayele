import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://pluggedbyayeley.com",
  "https://www.pluggedbyayeley.com",
  "https://plugged-by-ayeley.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function respond(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return respond({ error: "Forbidden origin." }, 403, headers);
    return new Response(null, { status: 204, headers });
  }
  if (!new Set(["GET", "POST"]).has(req.method)) return respond({ error: "Method not allowed." }, 405, headers);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return respond({ error: "Forbidden origin." }, 403, headers);

  const authorization = req.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !supabaseUrl || !serviceRoleKey) {
    return respond({ error: "Authentication is required." }, 401, headers);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return respond({ error: "Please sign in again." }, 401, headers);

    const { data: callerRole, error: roleError } = await admin
      .from("admin_users")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (roleError) throw roleError;
    if (callerRole?.role !== "admin") return respond({ error: "Administrator access is required." }, 403, headers);

    if (req.method === "GET") {
      const { data: staffRows, error: staffError } = await admin
        .from("admin_users")
        .select("user_id, created_at")
        .eq("role", "assistant")
        .order("created_at", { ascending: false });
      if (staffError) throw staffError;

      const assistants = staffRows || [];
      if (!assistants.length) return respond({ assistants: [] }, 200, headers);

      const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (usersError) throw usersError;

      const usersById = new Map((usersData.users || []).map((user) => [user.id, user]));
      const result = assistants.map((row) => {
        const user = usersById.get(row.user_id);
        const metadata = asRecord(user?.user_metadata);
        return {
          id: row.user_id,
          email: user?.email || "",
          name: typeof metadata.full_name === "string" ? metadata.full_name : "",
          created_at: row.created_at,
          last_sign_in_at: user?.last_sign_in_at || null,
          invited: Boolean(user && !user.email_confirmed_at),
          active: Boolean(user && !user.banned_until),
        };
      });

      return respond({ assistants: result }, 200, headers);
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).length > 4096) return respond({ error: "Request is too large." }, 413, headers);
    let body: Record<string, unknown>;
    try {
      body = asRecord(JSON.parse(rawBody));
    } catch {
      return respond({ error: "Invalid request body." }, 400, headers);
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return respond({ error: "Enter a valid email address." }, 400, headers);
    }
    if (name.length < 2 || name.length > 120) return respond({ error: "Enter the assistant's name." }, 400, headers);

    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const existingUser = (usersData.users || []).find((user) => user.email?.toLowerCase() === email);

    if (existingUser?.banned_until && new Date(existingUser.banned_until).getTime() > Date.now()) {
      return respond({ error: "That Auth account is currently blocked. Unblock it before adding assistant access." }, 409, headers);
    }

    if (existingUser) {
      const { data: existingAccess, error: accessError } = await admin
        .from("admin_users")
        .select("role")
        .eq("user_id", existingUser.id)
        .maybeSingle();
      if (accessError) throw accessError;
      if (existingAccess?.role === "admin") {
        return respond({ error: "That email already has administrator access and cannot be changed to an assistant account." }, 409, headers);
      }
      if (existingAccess?.role === "assistant") {
        return respond({ alreadyAssistant: true, email }, 200, headers);
      }
    }

    let targetUser = existingUser;
    const newlyInvited = !existingUser;
    if (!targetUser) {
      const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name },
        redirectTo: `${origin || "https://pluggedbyayeley.com"}/assistant-invite`,
      });
      if (inviteError || !invited.user) {
        console.error("Assistant invitation failed:", inviteError?.message || "No user returned.");
        return respond({ error: "Could not send the invitation. Check Auth email delivery settings and try again." }, 502, headers);
      }
      targetUser = invited.user;
    }

    const { error: roleSaveError } = await admin.from("admin_users").upsert({
      user_id: targetUser.id,
      role: "assistant",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (roleSaveError) {
      console.error("Assistant role assignment failed:", roleSaveError.message);
      if (newlyInvited) await admin.auth.admin.deleteUser(targetUser.id);
      return respond({ error: "The account could not be assigned assistant access. Please try again." }, 500, headers);
    }

    if (existingUser) {
      const { error: metadataError } = await admin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { ...asRecord(existingUser.user_metadata), full_name: name },
      });
      if (metadataError) console.error("Assistant display name could not be saved:", metadataError.message);
      return respond({ enabledExisting: true, email, name }, 200, headers);
    }

    return respond({ invited: true, email, name }, 201, headers);
  } catch (error) {
    console.error("Assistant management failed:", error instanceof Error ? error.message : "Unknown error");
    return respond({ error: "Assistant management is temporarily unavailable." }, 500, headers);
  }
});
