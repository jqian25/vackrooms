import * as THREE from "three";
import { CELL } from "./maze";

export function clearsJump(eyeY: number) {
  return eyeY > 1.95;
}
export const DOOR_REVEAL = 2.8;
export function doorVisible(distance: number) {
  return distance < DOOR_REVEAL;
}

export interface GoalInput { x: number; y: number; z: number; holding: boolean; dt: number }
export interface GoalFrame {
  x: number; z: number; nearSwitch: boolean; switched: boolean; nearExit: boolean;
  revealed: boolean; won: boolean; red: boolean; blocked: boolean;
}

export class LevelGoal {
  private readonly laneX = 2.5 * CELL;
  private readonly barrierZ = 1.55 * CELL;
  private readonly doorX = 2 * CELL + 0.2;
  private readonly doorZ = 3.5 * CELL;
  private readonly surfaces: { mat: THREE.MeshStandardMaterial; color: string; emissive: string; intensity: number }[];
  private cleared = false;
  private entered = false;
  private revealed = false;
  private red = false;
  private switchDown = false;
  private warned = false;
  private wall: THREE.Mesh;
  private lever: THREE.Mesh;
  private door: THREE.Mesh;
  private frame: THREE.Mesh;
  private readonly hiddenMat: THREE.Material;
  private readonly openMat = new THREE.MeshStandardMaterial({ color: "#241612", roughness: 0.78, emissive: "#7a341c", emissiveIntensity: 0.4 });
  private readonly yellow: { fog: string; sky: string; ground: string };
  private readonly redPalette = { fog: "#c42e28", sky: "#ff9a90", ground: "#6a1814" };

  constructor(
    private scene: THREE.Scene,
    private fog: THREE.Fog,
    private fill: THREE.HemisphereLight,
    surfaces: THREE.MeshStandardMaterial[],
  ) {
    this.yellow = {
      fog: `#${fog.color.getHexString()}`,
      sky: `#${fill.color.getHexString()}`,
      ground: `#${fill.groundColor.getHexString()}`,
    };
    this.surfaces = surfaces.map((mat) => ({
      mat,
      color: `#${mat.color.getHexString()}`,
      emissive: `#${mat.emissive.getHexString()}`,
      intensity: mat.emissiveIntensity,
    }));
    const concrete = new THREE.MeshStandardMaterial({ color: "#8d8770", roughness: 0.9 });
    this.wall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.62, 0.32), concrete);
    this.wall.position.set(this.laneX, 0.31, this.barrierZ);
    this.wall.castShadow = this.wall.receiveShadow = true;
    const metal = new THREE.MeshStandardMaterial({ color: "#d6c56a", roughness: 0.45, emissive: "#6a5a20", emissiveIntensity: 0.4 });
    this.lever = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.35), metal);
    this.lever.position.set(this.laneX + 1.15, 0.7, this.barrierZ + 0.9);
    this.lever.castShadow = true;
    this.hiddenMat = surfaces[0];
    this.door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.15, 0.16), this.hiddenMat);
    this.door.position.set(this.doorX, 1.575, this.doorZ);
    this.door.rotation.y = Math.PI / 2;
    this.door.name = "hidden-door";
    const frameMat = new THREE.MeshStandardMaterial({ color: "#c4553a", roughness: 0.6, emissive: "#5a2018", emissiveIntensity: 0.35 });
    this.frame = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.35, 0.08), frameMat);
    this.frame.position.set(this.doorX + 0.12, 1.25, this.doorZ);
    this.frame.rotation.y = Math.PI / 2;
    this.frame.visible = false;
    scene.add(this.wall, this.lever, this.door, this.frame);
  }
  get isRed() { return this.red; }
  get hasEntered() { return this.entered; }
  get barrier() { return { x: this.laneX, y: 0.31, z: this.barrierZ, hx: 2.2, hy: 0.31, hz: 0.16 }; }
  get doorBox() { return { x: this.doorX, y: 1.575, z: this.doorZ, hx: 0.08, hy: 1.575, hz: 1.2 }; }
  private paint(red: boolean) {
    const palette = red ? this.redPalette : this.yellow;
    this.fog.color.set(palette.fog);
    if (this.scene.background instanceof THREE.Color) this.scene.background.set(palette.fog);
    this.fill.color.set(palette.sky);
    this.fill.groundColor.set(palette.ground);
    for (const surface of this.surfaces) {
      if (red) {
        surface.mat.color.set("#ff4a40");
        surface.mat.emissive.set("#ff2a24");
        surface.mat.emissiveIntensity = Math.max(0.22, surface.intensity);
      } else {
        surface.mat.color.set(surface.color);
        surface.mat.emissive.set(surface.emissive);
        surface.mat.emissiveIntensity = surface.intensity;
      }
    }
  }
  setRed() {
    if (this.red) return false;
    this.red = true;
    this.paint(true);
    return true;
  }
  toggleColor() {
    this.red = !this.red;
    this.paint(this.red);
  }
  reset() {
    this.entered = false;
    this.revealed = false;
    this.cleared = false;
    this.warned = false;
    this.red = false;
    this.switchDown = false;
    this.door.visible = this.wall.visible = this.lever.visible = true;
    this.frame.visible = false;
    this.door.material = this.hiddenMat;
    this.paint(false);
  }
  enter() {
    if (this.entered || !this.revealed) return false;
    this.entered = true;
    this.revealed = false;
    this.door.visible = this.frame.visible = this.wall.visible = this.lever.visible = false;
    return true;
  }
  consumeWarning() {
    if (this.warned) return false;
    this.warned = true;
    return true;
  }
  update(input: GoalInput): GoalFrame {
    const nearSwitch = !this.entered && Math.hypot(input.x - this.lever.position.x, input.z - this.lever.position.z) < 2.4;
    const doorDistance = Math.hypot(input.x - this.doorX, input.z - this.doorZ);
    this.revealed = !this.entered && doorVisible(doorDistance);
    this.door.material = this.revealed ? this.openMat : this.hiddenMat;
    this.frame.visible = this.revealed;
    let blocked = false;
    let z = input.z;
    if (!this.entered && Math.abs(input.x - this.laneX) < 2.15 && input.z < this.barrierZ - 0.05) {
      if (clearsJump(input.y)) this.cleared = true;
      else if (!this.cleared) {
        z = this.barrierZ + 0.5;
        blocked = true;
      }
    }
    let switched = false;
    if (nearSwitch && input.holding && !this.switchDown) {
      this.switchDown = true;
      switched = true;
      this.toggleColor();
    }
    if (!input.holding) this.switchDown = false;
    return { x: input.x, z, nearSwitch, switched, nearExit: this.revealed, revealed: this.revealed, won: false, red: this.red, blocked };
  }
}
