import { NextRequest, NextResponse } from "next/server";

// Always run on the server and never cache API calls.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND = (process.env.BACKEND_URL ?? "https://api.investo.fund").replace(/\/$/, "");

// Headers passed to the backend, and headers passed back to the browser.
const REQUEST_HEADERS = ["authorization", "content-type", "accept", "accept-language"];
const RESPONSE_HEADERS = ["content-type", "content-disposition", "cache-control"];

type Ctx = { params: { path: string[] } | Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { path } = await Promise.resolve(ctx.params);
  const url = `${BACKEND}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const out = new Headers();
    for (const name of RESPONSE_HEADERS) {
      const value = res.headers.get(name);
      if (value) out.set(name, value);
    }
    return new NextResponse(res.body, { status: res.status, headers: out });
  } catch (err) {
    console.error("API proxy error:", req.method, url, err);
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
