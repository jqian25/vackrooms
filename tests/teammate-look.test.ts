import assert from "node:assert/strict";
import test from "node:test";
import { PERSONALITIES, TEAMMATE_MODELS, teammateLook } from "../src/lib/game/teammate-look";

test("the same id always gets the same face and personality", () => {
  const look = teammateLook("seat-4");
  assert.deepEqual(teammateLook("seat-4"), look);
  assert.ok(TEAMMATE_MODELS.includes(look.model));
  assert.ok(PERSONALITIES.some((personality) => personality.label === look.personality.label));
  assert.notDeepEqual(teammateLook("seat-4"), teammateLook("someone-else"));
});
