import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { joinRoom, openRoom, pulseRoom } from "../src/lib/net/rooms";

const file = path.join(os.tmpdir(), `vackrooms-rooms-${process.pid}.json`);

test("two people can join, and a lost room reopens with the same code", () => {
  process.env.VACKROOMS_ROOMS = file;
  fs.rmSync(file, { force: true });
  const host = openRoom(398557, "ZZZZ", 2);
  assert.ok(host);
  assert.equal(host.code, "ZZZZ");
  assert.equal(host.host, true);
  const first = joinRoom("z z z z");
  const second = joinRoom("zzzz");
  assert.ok(first && second);
  assert.equal(first.seed, 398557);
  assert.equal(second.generation, 2);
  assert.equal(joinRoom("ZZZZ")?.code, "ZZZZ");
  assert.equal(joinRoom("ZZZZ"), null);
  const beat = pulseRoom({
    code: "ZZZZ", id: host.id, pose: { x: 1, y: 1.66, z: 2, yaw: 0, speed: 0 },
  });
  assert.equal(beat?.count, 4);
  fs.rmSync(file, { force: true });
  const again = openRoom(398557, "ZZZZ", 2);
  assert.equal(again?.code, "ZZZZ");
  assert.equal(again?.host, true);
  assert.equal(again?.seed, 398557);
  fs.rmSync(file, { force: true });
});
