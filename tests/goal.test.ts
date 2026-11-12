import assert from "node:assert/strict";
import test from "node:test";
import { clearsJump, doorVisible, DOOR_REVEAL } from "../src/lib/game/goal";

test("a standing eye cannot clear the wall, and the door stays hidden until you are close", () => {
  assert.equal(clearsJump(1.66), false);
  assert.equal(clearsJump(1.96), true);
  assert.equal(DOOR_REVEAL, 2.8);
  assert.equal(doorVisible(2.7), true);
  assert.equal(doorVisible(2.8), false);
});
