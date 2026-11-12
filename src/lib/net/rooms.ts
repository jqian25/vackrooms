import fs from "fs";

export type Pose = { x: number; y: number; z: number; yaw: number; speed: number };
export type MonsterSnap = { x: number; z: number; heading: number; present: boolean; heads: number; phase: string };
type Member = { id: string; pose: Pose; seen: number };
type Room = { code: string; seed: number; generation: number; hostId: string; members: Map<string, Member>; monsters: MonsterSnap[] };
type SavedRoom = Omit<Room, "members"> & { members: Member[] };

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const staleMs = 90000;

function storePath() {
  return process.env.VACKROOMS_ROOMS ?? "/tmp/vackrooms-rooms.json";
}
function load(): Map<string, Room> {
  try {
    const saved = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ storePath(), "utf8")) as SavedRoom[];
    return new Map(saved.map((room) => [room.code, {
      ...room,
      generation: room.generation ?? 2,
      members: new Map(room.members.map((member) => [member.id, member])),
    }]));
  } catch {
    return new Map();
  }
}
function save(rooms: Map<string, Room>) {
  const saved: SavedRoom[] = [...rooms.values()].map((room) => ({ ...room, members: [...room.members.values()] }));
  const path = storePath();
  const temporary = `${path}.${process.pid}.tmp`;
  fs.writeFileSync(/*turbopackIgnore: true*/ temporary, JSON.stringify(saved));
  fs.renameSync(temporary, path);
}
function withRooms<T>(change: (rooms: Map<string, Room>) => T) {
  const lock = `${storePath()}.lock`;
  for (let attempt = 0; attempt < 40; attempt++) {
    let fd: number | undefined;
    try {
      fd = fs.openSync(lock, "wx");
      const rooms = load();
      const result = change(rooms);
      save(rooms);
      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
    } finally {
      if (fd !== undefined) {
        fs.closeSync(fd);
        try { fs.unlinkSync(lock); } catch { /* already cleared */ }
      }
    }
  }
  const rooms = load();
  const result = change(rooms);
  save(rooms);
  return result;
}
function normalize(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}
function freshId() {
  return Math.random().toString(36).slice(2, 10);
}
function prune(rooms: Map<string, Room>, room: Room, now: number) {
  for (const [id, member] of room.members) if (now - member.seen > staleMs) room.members.delete(id);
  if (!room.members.has(room.hostId)) {
    const next = [...room.members.values()].sort((a, b) => b.seen - a.seen)[0];
    if (next) room.hostId = next.id;
  }
  if (!room.members.size) rooms.delete(room.code);
}

export function openRoom(seed: number, preferred?: string, generation = 2) {
  return withRooms((rooms) => {
    const wanted = preferred ? normalize(preferred) : "";
    const pose = { x: 0, y: 1.66, z: 0, yaw: 0, speed: 0 };
    if (wanted.length === 4 && rooms.has(wanted)) {
      const existing = rooms.get(wanted)!;
      prune(rooms, existing, Date.now());
      if (rooms.has(wanted)) {
        if (existing.members.size >= 4) return null;
        const id = freshId();
        existing.members.set(id, { id, pose, seen: Date.now() });
        return { code: existing.code, id, host: false, seed: existing.seed, generation: existing.generation };
      }
    }
    let value = wanted.length === 4 ? wanted : "";
    if (!value) {
      do {
        value = "";
        for (let i = 0; i < 4; i++) value += alphabet[Math.floor(Math.random() * alphabet.length)];
      } while (rooms.has(value));
    }
    const id = freshId();
    const room: Room = { code: value, seed, generation, hostId: id, members: new Map(), monsters: [] };
    room.members.set(id, { id, pose, seen: Date.now() });
    rooms.set(value, room);
    return { code: value, id, host: true, seed, generation };
  });
}
export function joinRoom(codeValue: string) {
  return withRooms((rooms) => {
    const code = normalize(codeValue);
    const room = rooms.get(code);
    if (!room) return null;
    prune(rooms, room, Date.now());
    if (!rooms.has(code) || room.members.size >= 4) return null;
    const id = freshId();
    room.members.set(id, { id, pose: { x: 0, y: 0, z: 0, yaw: 0, speed: 0 }, seen: Date.now() });
    return { code: room.code, id, host: false, seed: room.seed, generation: room.generation };
  });
}
export function pulseRoom(input: { code: string; id: string; pose: Pose; monsters?: MonsterSnap[] }) {
  return withRooms((rooms) => {
    const code = normalize(input.code);
    const room = rooms.get(code);
    if (!room) return null;
    const now = Date.now();
    prune(rooms, room, now);
    const member = room.members.get(input.id);
    if (!member || !rooms.has(code)) return null;
    member.pose = input.pose;
    member.seen = now;
    const host = input.id === room.hostId;
    if (host && input.monsters) room.monsters = input.monsters.slice(0, 4);
    const players = [...room.members.values()].filter((other) => other.id !== input.id).map((other) => ({ id: other.id, ...other.pose }));
    return { host, seed: room.seed, generation: room.generation, count: room.members.size, players, monsters: room.monsters };
  });
}
