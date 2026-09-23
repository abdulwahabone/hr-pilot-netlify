import type { Context } from "@netlify/functions";
import type { z } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function json(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}

export async function parseBody<T extends z.ZodType>(req: Request, schema: T, message?: string) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(message ?? parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }
  return parsed.data as z.infer<T>;
}

type Method = "GET" | "POST" | "PATCH";
type Handler = (req: Request, context: Context) => Promise<Response>;

// Dispatches on the HTTP method and turns thrown errors into JSON responses.
export function route(handlers: Partial<Record<Method, Handler>>) {
  return async (req: Request, context: Context) => {
    const handler = handlers[req.method as Method];
    if (!handler) {
      return json(
        { error: "Method not allowed." },
        { status: 405, headers: { Allow: Object.keys(handlers).join(", ") } }
      );
    }

    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, { status: error.status });
      }
      console.error(error);
      return json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}
