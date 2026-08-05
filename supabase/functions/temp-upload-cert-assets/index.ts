import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const FILES = [
  { url: "https://www.kairossecurityacademy.com/__l5e/assets-v1/1f92568b-1225-4b58-962e-f6e39b746c71/level2-certificate-template.jpg", path: "level2-certificate-template.jpg", type: "image/jpeg" },
  { url: "https://www.kairossecurityacademy.com/__l5e/assets-v1/03f01542-c983-45fa-aca4-ed32a39e3326/stephen-taylor-signature-transparent.png", path: "stephen-taylor-signature-transparent.png", type: "image/png" },
];

Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const results: unknown[] = [];
  for (const f of FILES) {
    const res = await fetch(f.url);
    const buf = new Uint8Array(await res.arrayBuffer());
    const { error } = await admin.storage.from("certificates").upload(f.path, buf, { contentType: f.type, upsert: true });
    const { data: info } = await admin.storage.from("certificates").list("", { search: f.path });
    results.push({ path: f.path, fetched: buf.length, uploadError: error?.message ?? null, stored: info?.[0]?.metadata ?? null });
  }
  return new Response(JSON.stringify({ results }, null, 2), { headers: { "Content-Type": "application/json" } });
});
