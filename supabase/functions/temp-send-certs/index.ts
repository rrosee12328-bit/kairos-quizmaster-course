const REGS = ["KTA-L3-20260805-90049", "KTA-L3-20260805-36800"];
const EMAIL = "rrosee12328@gmail.com";

Deno.serve(async () => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = Deno.env.get("SUPABASE_URL")!;
  const out: unknown[] = [];
  for (const registrationNumber of REGS) {
    const res = await fetch(`${url}/functions/v1/send-certificate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ registrationNumber, email: EMAIL }),
    });
    out.push({ registrationNumber, status: res.status, body: await res.text() });
  }
  return new Response(JSON.stringify({ out }, null, 2), { headers: { "Content-Type": "application/json" } });
});
