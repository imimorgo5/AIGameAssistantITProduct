import { forwardApi } from "_app/server";

import type { NextRequest } from "next/server";

interface Context {
  params: Promise<{ path: string[] }>;
}

async function handle(request: NextRequest, context: Context) {
  return forwardApi(request, (await context.params).path);
}

export {
  handle as GET,
  handle as HEAD,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
