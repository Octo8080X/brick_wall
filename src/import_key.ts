import { decode } from "../deps.ts";

export async function importKey(src: string) {
  const decodedKey = decode(src);
  return await crypto.subtle.importKey(
    "raw",
    decodedKey,
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
  );
}
