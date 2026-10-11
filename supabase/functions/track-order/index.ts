import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://pluggedbyayeley.com",
  "https://www.pluggedbyayeley.com",
  "https://plugged-by-ayeley.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
]);

function headersFor(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };

  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function respond(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), { status, headers });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = headersFor(origin);

  if (req.method === "OPTIONS") {
    return origin && !allowedOrigins.has(origin)
      ? respond({ success: false, error: "Forbidden origin." }, 403, headers)
      : new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return respond({ success: false, error: "Method not allowed." }, 405, headers);
  }

  if (origin && !allowedOrigins.has(origin)) {
    return respond({ success: false, error: "Forbidden origin." }, 403, headers);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = asRecord(await req.json());
    } catch {
      return respond({ success: false, error: "Enter a valid order number and checkout contact." }, 400, headers);
    }
    const orderNumber = typeof body.order_number === "string"
      ? body.order_number.trim().toUpperCase()
      : "";
    const contact = typeof body.contact === "string"
      ? body.contact.trim()
      : "";

    if (orderNumber.length < 6 || orderNumber.length > 40 || contact.length < 5 || contact.length > 254) {
      return respond({
        success: false,
        error: "Enter your order number and checkout email or phone number.",
      }, 400, headers);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("track-order: server configuration is missing.");
      return respond({ success: false, error: "Order tracking is temporarily unavailable." }, 503, headers);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.rpc("track_order", {
      p_order_number: orderNumber,
      p_contact: contact,
    });

    if (error) {
      const message = error.message || "";
      if (message.includes("Too many attempts") || message.includes("Tracking is busy")) {
        return respond({
          success: false,
          error: "Too many attempts. Please wait a few minutes and try again.",
        }, 429, headers);
      }

      console.error("track-order: lookup failed.", message);
      return respond({ success: false, error: "Unable to retrieve order status right now." }, 503, headers);
    }

    const result = asRecord(data);
    if (!result.order_number) {
      return respond({
        success: false,
        error: "We couldn't find an order with those details. Check the order number and checkout email or phone.",
      }, 404, headers);
    }

    // Explicitly whitelist the customer-safe fields returned after contact verification.
    const items = Array.isArray(result.items)
      ? result.items.map((item) => {
        const entry = asRecord(item);
        return {
          name: entry.name,
          price: entry.price,
          quantity: entry.quantity,
          line_total: entry.line_total,
        };
      })
      : [];

    return respond({
      success: true,
      order: {
        order_number: result.order_number,
        order_status: result.order_status,
        status: result.order_status,
        payment_status: result.payment_status,
        payment_method: result.payment_method,
        created_at: result.created_at,
        paid_at: result.paid_at,
        delivery_region: result.delivery_region,
        delivery_address: result.delivery_address,
        delivery_lat: result.delivery_lat,
        delivery_lng: result.delivery_lng,
        distance_km: result.distance_km,
        subtotal: result.subtotal,
        delivery_fee: result.delivery_fee,
        total: result.total,
        currency: result.currency,
        items,
      },
    }, 200, headers);
  } catch (error) {
    console.error(
      "track-order: unexpected error.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ success: false, error: "Something went wrong. Please try again." }, 500, headers);
  }
});
