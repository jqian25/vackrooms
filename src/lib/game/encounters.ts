import type { Vector3 } from "three";
import { groundDistance, type EntityNavigation } from "./entity-navigation";
import { Stalker, type StalkerInput } from "./stalker";

/** Two resident creatures, staggered arrivals, and a single holder at a time. */
export class Encounters {
  readonly stalkers: readonly Stalker[];
  private escapeGrace = 0;
  private enabled = true;

  constructor(seed: number, navigation: EntityNavigation) {
    this.stalkers = [
      new Stalker(seed, navigation),
      new Stalker(seed ^ 0x70797261, navigation, 45),
    ];
  }
  get attacker() {
    return this.stalkers.find((stalker) => stalker.attacking);
  }
  get attacking() {
    return !!this.attacker;
  }
  get attackTime() {
    return this.attacker?.attackTime ?? 0;
  }
  get present() {
    return this.stalkers.some((stalker) => stalker.present);
  }
  reset() {
    for (const stalker of this.stalkers) stalker.reset();
    this.escapeGrace = 0;
  }
  /** Exploration mode also releases an existing grab immediately. */
  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.reset();
  }
  escape() {
    if (!this.attacker?.escape()) return false;
    // A second creature cannot immediately undo a successful jump escape.
    this.escapeGrace = 3;
    return true;
  }
  update(
    dt: number,
    input: StalkerInput,
    footstep: (position: Vector3, running: boolean) => void,
  ) {
    if (!this.enabled) return false;
    this.escapeGrace = Math.max(0, this.escapeGrace - Math.min(dt, 0.1));
    const attacker = this.attacker;
    if (attacker) return attacker.update(dt, input, footstep);
    for (const stalker of this.stalkers) {
      stalker.update(dt, {
        ...input,
        canGrab: this.escapeGrace <= 0,
        otherPositions: this.stalkers
          .filter((other) => other !== stalker && other.present)
          .map((other) => other.position),
      }, footstep);
      if (stalker.attacking) break;
    }
    this.bite();
    return false;
  }
  private bite() {
    const live = this.stalkers.filter((stalker) => stalker.present && !stalker.attacking);
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        if (groundDistance(live[i].position, live[j].position) > 1.45) continue;
        live[i].devour();
        live[j].devour();
      }
    for (const stalker of this.stalkers) {
      const crowded = this.stalkers.some((other) => other !== stalker && other.present && groundDistance(other.position, stalker.position) < 2.6);
      if (!crowded) stalker.rearmBite();
    }
  }
}
