import { bcrypt, verify } from "../deps.ts";
import { importKey } from "./import_key.ts";

export class BrickWallApiValidator {
  #BRICK_WALL_API_HASHED_PASSWORD!: string;
  #BRICK_WALL_API_JWT_KEY!: CryptoKey;
  constructor() {}
  public async init() {
    const brickWallJwtKey = Deno.env.get("BRICK_WALL_API_JWT_KEY");
    if (!brickWallJwtKey) {
      throw new Error("No set env `BRICK_WALL_API_JWT_KEY`");
    }
    this.#BRICK_WALL_API_JWT_KEY = await importKey(brickWallJwtKey);

    const brickWallHashedPassword = Deno.env.get(
      "BRICK_WALL_API_HASHED_PASSWORD",
    );
    if (!brickWallHashedPassword) {
      throw new Error("No set env `BRICK_WALL_API_HASHED_PASSWORD`");
    }
    this.#BRICK_WALL_API_HASHED_PASSWORD = brickWallHashedPassword;
  }

  isSetMembers(): boolean {
    return (
      !!this.#BRICK_WALL_API_HASHED_PASSWORD && !!this.#BRICK_WALL_API_JWT_KEY
    );
  }

  public async validate(req: Request): Promise<boolean> {
    try {
      if (!this.isSetMembers()) {
        await this.init();
      }
      const { headers } = req;
      const brickWallToken = headers.get("brick-wall-manager");

      if (!brickWallToken) {
        throw new Error("No set header `brick-wall-manager`.");
      }
      const payload = await verify(
        brickWallToken,
        this.#BRICK_WALL_API_JWT_KEY,
      );
      if (!payload) {
        throw new Error("Invalid `brick-wall-manager`.");
      }
      if (
        !payload.brickWallApiPassword ||
        typeof payload.brickWallApiPassword !== "string"
      ) {
        throw new Error("No set parameter `brickWallApiPassword`.");
      }
      if (
        !bcrypt.compareSync(
          payload.brickWallApiPassword,
          this.#BRICK_WALL_API_HASHED_PASSWORD!,
        )
      ) {
        throw new Error("Invalid `brickWallApiPassword`.");
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
