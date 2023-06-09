import { create } from "../deps.ts";
import { importKey } from "./import_key.ts";

const brickWallJwtKey = Deno.env.get("BRICK_WALL_JWT_KEY");
if (!brickWallJwtKey) {
  throw new Error("No set env `BRICK_WALL_JWT_KEY`");
}

const brickWallPassword = Deno.env.get("BRICK_WALL_PASSWORD");
if (!brickWallPassword) {
  throw new Error("No set env `BRICK_WALL_PASSWORD`");
}

const key = await importKey(brickWallJwtKey);

const header_jwt_token = await create(
  { alg: "HS512", typ: "JWT" },
  {
    brickWallToken: brickWallPassword,
  },
  key,
);

export { header_jwt_token };
