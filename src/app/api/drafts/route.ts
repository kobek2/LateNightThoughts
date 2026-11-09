import { studioOpen } from "@/lib/auth";
import { saveDraftRecord } from "@/lib/store";
import type { DraftInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await studioOpen())) {
    return Response.json({ error: "The studio passphrase was rejected." }, { status: 401 });
  }
  let input: DraftInput;
  try {
    input = (await request.json()) as DraftInput;
  } catch {
    return Response.json({ error: "Draft could not be read." }, { status: 400 });
  }
  if (!input || typeof input.id !== "string" || !Array.isArray(input.takes)) {
    return Response.json({ error: "Draft could not be read." }, { status: 400 });
  }
  const result = saveDraftRecord({
    id: input.id,
    title: typeof input.title === "string" ? input.title : "",
    excerpt: typeof input.excerpt === "string" ? input.excerpt : "",
    body: typeof input.body === "string" ? input.body : "",
    tags: typeof input.tags === "string" ? input.tags : "",
    takes: input.takes,
    sources: Array.isArray(input.sources) ? input.sources : [],
  });
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }
  return Response.json(result);
}
