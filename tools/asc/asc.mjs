// Cliente mínimo de la App Store Connect API (JWT ES256 con la llave .p8).
// Uso: node tools/asc/asc.mjs <ruta relativa de la API> [--method GET|POST|PATCH] [--body '{...}']
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KEY_ID = "H59CTMG8GG";
const ISSUER_ID = "c269f2b5-9d7d-40ab-9413-431217c4e2c4";
const here = dirname(fileURLToPath(import.meta.url));
const pem = readFileSync(join(here, `AuthKey_${KEY_ID}.p8`), "utf8");

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
export function token() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64({ alg: "ES256", kid: KEY_ID, typ: "JWT" });
  const payload = b64({ iss: ISSUER_ID, iat: now, exp: now + 19 * 60, aud: "appstoreconnect-v1" });
  const der = sign("sha256", Buffer.from(`${header}.${payload}`), { key: createPrivateKey(pem), dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${Buffer.from(der).toString("base64url")}`;
}

export async function asc(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path.startsWith("/") ? "" : "/"}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(json.errors ?? json).slice(0, 4000)}`);
  return json;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [, , path, ...rest] = process.argv;
  const method = rest.includes("--method") ? rest[rest.indexOf("--method") + 1] : "GET";
  const body = rest.includes("--body") ? JSON.parse(rest[rest.indexOf("--body") + 1]) : undefined;
  asc(path, { method, body }).then((j) => console.log(JSON.stringify(j, null, 2))).catch((e) => { console.error(e.message); process.exit(1); });
}
