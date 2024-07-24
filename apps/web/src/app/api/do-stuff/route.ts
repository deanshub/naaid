import { doStuff } from "../../actions/do-stuff";

export function POST(): Response {
  doStuff();
  return Response.json({ ok: true });
}
