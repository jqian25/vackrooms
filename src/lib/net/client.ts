import type { MonsterSnap, Pose } from "./rooms";

export type Seat = { code: string; id: string; host: boolean; seed: number; generation: number };
export type RoomView = {
  host: boolean; seed: number; generation: number; count: number;
  players: { id: string; x: number; y: number; z: number; yaw: number; speed: number }[];
  monsters: MonsterSnap[];
};

async function post(body: unknown) {
  const response = await fetch("/api/room", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "联机失败");
  return data;
}
export function openSeat(seed: number, code?: string, generation = 2) {
  return post({ op: "open", seed, code, generation }) as Promise<Seat>;
}
export function joinSeat(code: string) {
  return post({ op: "join", code }) as Promise<Seat>;
}
export function pulseSeat(code: string, id: string, pose: Pose, monsters?: MonsterSnap[]) {
  return post({ op: "pulse", code, id, pose, monsters }) as Promise<RoomView>;
}
