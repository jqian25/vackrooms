import assert from "node:assert/strict";
import test from "node:test";
import { FACE_COUNT, nextFaceIndex } from "../src/lib/game/slit-face";

test("the scare picks one of sixteen faces and does not repeat the last one", () => {
  assert.equal(FACE_COUNT, 16);
  assert.equal(nextFaceIndex(16, 3, 3 / 16), 4);
  assert.equal(nextFaceIndex(16, 1, 0.1), 2);
});
