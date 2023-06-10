import "https://deno.land/std@0.190.0/dotenv/load.ts";
import { Application, Context, Router } from "../deps.ts";
import { proxy } from "../deps.ts";
import { header_jwt_token } from "./header_jwt_token.ts";
import { BrickWallApiValidator } from "./brick_wall_API_validator.ts";

export class BrickWall {
  #port: number | undefined;
  #handlerRules: ((
    ctx: Context<Record<string, any>, Record<string, any>>,
    next: () => Promise<unknown>,
  ) => Application)[];
  #apiRouterRules: Router[];
  #proxyTarget: string;
  constructor(option?: { port?: number }) {
    this.#port = option?.port;
    this.#handlerRules = [];
    this.#apiRouterRules = [];

    const proxyTarget = Deno.env.get("PROXY_TARGET")
    if(!proxyTarget){
      throw new Error("No set env `PROXY_TARGET`");
    }
    this.#proxyTarget = proxyTarget;
  }
  useHandler(
    handler: (
      ctx: Context<Record<string, any>, Record<string, any>>,
      next: () => Promise<unknown>,
    ) => Application,
  ) {
    this.#handlerRules.push(handler);
  }
  useApiRouter(router: Router) {
    this.#apiRouterRules.push(router);
  }
  async start() {
    const app = new Application();

    const router = new Router();
    this.#apiRouterRules.forEach((rule) => {
      router.use("/api", rule.routes(), rule.allowedMethods());
    });

    app.use(async (ctx, next) => {
      const brickWallApiValidator = new BrickWallApiValidator();
      if (await brickWallApiValidator.validate(ctx.request)) {
        await router.allowedMethods();
        await router.routes()(ctx, next);
      } else {
        await next();
      }
    });

    this.#handlerRules.forEach((rule) => {
      app.use(rule);
    });

    app.use(
      proxy(
        this.#proxyTarget,
        {
          parseReqBody: true,
          proxyReqUrlDecorator(url, req) {
            url.pathname = req.url.pathname;
            return url;
          },
          proxyReqInitDecorator(proxyReqOpts, _srcReq) {
            proxyReqOpts.headers.set("brick-wall-token", header_jwt_token);
            return proxyReqOpts;
          },
        },
      ),
    );

    await app.listen({ port: this.#port });
  }
}
