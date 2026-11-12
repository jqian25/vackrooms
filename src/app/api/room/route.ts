import { joinRoom, openRoom, pulseRoom, type MonsterSnap, type Pose } from "@/lib/net/rooms";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    op?: string; code?: string; id?: string; seed?: number; generation?: number; pose?: Pose; monsters?: MonsterSnap[];
  } | null;
  if (!body?.op) return Response.json({ error: "bad" }, { status: 400 });
  if (body.op === "open") {
    const seed = Number.isFinite(body.seed) ? Math.floor(body.seed!) : 1;
    const generation = body.generation === 1 ? 1 : 2;
    const opened = openRoom(seed, body.code, generation);
    if (!opened) return Response.json({ error: "房间已经满了" }, { status: 404 });
    return Response.json(opened);
  }
  if (body.op === "join") {
    const joined = body.code ? joinRoom(body.code) : null;
    if (!joined) return Response.json({ error: "没有这个房间" }, { status: 404 });
    return Response.json(joined);
  }
  if (body.op === "pulse" && body.code && body.id && body.pose) {
    const view = pulseRoom({ code: body.code, id: body.id, pose: body.pose, monsters: body.monsters });
    if (!view) return Response.json({ error: "房间已经散了" }, { status: 404 });
    return Response.json(view);
  }
  return Response.json({ error: "bad" }, { status: 400 });
}
