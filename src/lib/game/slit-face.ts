import * as THREE from "three";

export const FACE_COUNT = 16;
export function nextFaceIndex(count: number, previous: number, roll: number) {
  const index = Math.min(count - 1, Math.max(0, Math.floor(roll * count)));
  if (count < 2 || index !== previous) return index;
  return (index + 1) % count;
}

type Eye = { x: number; y: number; rx: number; ry: number; color: string; brow?: "angry" | "sad" | "bush" };
const FACES: { eyes: Eye[]; mouth: string; grin: number }[] = [
  { eyes: [{ x: 256, y: 170, rx: 52, ry: 56, color: "#a13cff" }], mouth: "#e23a86", grin: 16 },
  { eyes: [{ x: 190, y: 175, rx: 34, ry: 30, color: "#5a3a16", brow: "bush" }, { x: 322, y: 175, rx: 34, ry: 30, color: "#5a3a16", brow: "bush" }], mouth: "#f4f4f4", grin: -8 },
  { eyes: [{ x: 188, y: 160, rx: 40, ry: 46, color: "#8fd24a" }, { x: 330, y: 190, rx: 26, ry: 32, color: "#b6e36a", brow: "sad" }], mouth: "#5a2a32", grin: 8 },
  { eyes: [{ x: 196, y: 170, rx: 28, ry: 24, color: "#7a2ad4", brow: "angry" }, { x: 316, y: 170, rx: 28, ry: 24, color: "#7a2ad4", brow: "angry" }], mouth: "#f7f7f7", grin: 4 },
  { eyes: [{ x: 190, y: 168, rx: 34, ry: 30, color: "#6d22c4", brow: "angry" }, { x: 322, y: 168, rx: 34, ry: 30, color: "#6d22c4", brow: "angry" }], mouth: "#7a20c8", grin: 22 },
  { eyes: [{ x: 256, y: 140, rx: 30, ry: 30, color: "#e2c15a" }, { x: 190, y: 210, rx: 26, ry: 24, color: "#d8b24a" }, { x: 322, y: 210, rx: 26, ry: 24, color: "#d8b24a" }], mouth: "#6a28b8", grin: -14 },
  { eyes: [{ x: 186, y: 176, rx: 42, ry: 40, color: "#7d8a3a" }, { x: 326, y: 176, rx: 42, ry: 40, color: "#7d8a3a" }], mouth: "#6a22b0", grin: 16 },
  { eyes: [{ x: 300, y: 170, rx: 38, ry: 40, color: "#8a4a2a" }], mouth: "#f2f2f2", grin: 12 },
  { eyes: [{ x: 188, y: 168, rx: 34, ry: 28, color: "#2f8a32", brow: "angry" }, { x: 324, y: 168, rx: 34, ry: 28, color: "#2f8a32", brow: "angry" }], mouth: "#111111", grin: 0 },
  { eyes: [{ x: 190, y: 175, rx: 34, ry: 36, color: "#f4f4f4", brow: "sad" }, { x: 322, y: 175, rx: 34, ry: 36, color: "#f4f4f4", brow: "sad" }], mouth: "#e7a0b0", grin: -6 },
  { eyes: [{ x: 190, y: 168, rx: 34, ry: 26, color: "#c42828", brow: "angry" }, { x: 322, y: 168, rx: 34, ry: 26, color: "#c42828", brow: "angry" }], mouth: "#f7f7f7", grin: 10 },
  { eyes: [{ x: 190, y: 175, rx: 36, ry: 36, color: "#4a6ad4" }, { x: 322, y: 175, rx: 36, ry: 36, color: "#4a6ad4" }], mouth: "#f4f4f4", grin: 26 },
  { eyes: [{ x: 190, y: 160, rx: 34, ry: 36, color: "#e2b13a" }, { x: 322, y: 160, rx: 34, ry: 36, color: "#e2b13a" }], mouth: "#3a9a32", grin: 8 },
  { eyes: [{ x: 190, y: 175, rx: 40, ry: 46, color: "#2a6adf" }, { x: 322, y: 175, rx: 40, ry: 46, color: "#2a6adf" }], mouth: "#f4f4f4", grin: -12 },
  { eyes: [{ x: 190, y: 172, rx: 36, ry: 22, color: "#86b432", brow: "angry" }, { x: 322, y: 172, rx: 36, ry: 22, color: "#86b432", brow: "angry" }], mouth: "#f7f7f7", grin: 28 },
  { eyes: [{ x: 190, y: 170, rx: 32, ry: 24, color: "#c42020", brow: "angry" }, { x: 322, y: 170, rx: 32, ry: 24, color: "#c42020", brow: "angry" }], mouth: "#f4f4f4", grin: -18 },
];

function drawEye(ctx: CanvasRenderingContext2D, spec: Eye) {
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#161616";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(spec.x, spec.y, spec.rx, spec.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = spec.color;
  ctx.beginPath();
  ctx.arc(spec.x, spec.y, spec.rx * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(spec.x, spec.y, spec.rx * 0.22, 0, Math.PI * 2);
  ctx.fill();
  if (!spec.brow) return;
  ctx.strokeStyle = spec.brow === "bush" ? "#c45a12" : "#161616";
  ctx.lineWidth = spec.brow === "bush" ? 14 : 8;
  ctx.beginPath();
  const tilt = spec.brow === "angry" ? (spec.x < 256 ? 14 : -14) : spec.brow === "sad" ? (spec.x < 256 ? -10 : 10) : 0;
  ctx.moveTo(spec.x - spec.rx, spec.y - spec.ry - 14 + tilt);
  ctx.quadraticCurveTo(spec.x, spec.y - spec.ry - 26, spec.x + spec.rx, spec.y - spec.ry - 14 - tilt);
  ctx.stroke();
}

export function drawFace(ctx: CanvasRenderingContext2D, index: number) {
  const face = FACES[index] ?? FACES[0];
  ctx.clearRect(0, 0, 512, 512);
  ctx.fillStyle = "#fffdf8";
  ctx.strokeStyle = "#161616";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.ellipse(256, 268, 168, 188, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const spec of face.eyes) drawEye(ctx, spec);
  const y = 320;
  ctx.fillStyle = face.mouth;
  ctx.beginPath();
  ctx.moveTo(150, y);
  ctx.quadraticCurveTo(256, y + face.grin * 2, 362, y);
  ctx.quadraticCurveTo(256, y + 64 + face.grin, 150, y);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7f7f2";
  for (let tooth = 0; tooth < 6; tooth++) ctx.fillRect(176 + tooth * 28, y + 6, 16, 18);
}

export class SlitFace {
  readonly mesh: THREE.Mesh;
  readonly blackoutMesh: THREE.Mesh;
  readonly bloodMesh: THREE.Mesh;
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly bloodCanvas = document.createElement("canvas");
  private readonly bloodCtx: CanvasRenderingContext2D;
  private readonly bloodTexture: THREE.CanvasTexture;
  private readonly drips: { x: number; y: number; speed: number; width: number }[];
  private shown = 0;
  private face = -1;
  private hold = 0;
  private cooling = false;
  constructor() {
    this.canvas.width = this.canvas.height = 512;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("face canvas unavailable");
    this.ctx = ctx;
    this.redraw();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.78),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 21;
    this.blackoutMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 1, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.blackoutMesh.frustumCulled = false;
    this.blackoutMesh.renderOrder = 19;
    this.blackoutMesh.position.z = -0.9;
    this.bloodCanvas.width = 256;
    this.bloodCanvas.height = 512;
    const blood = this.bloodCanvas.getContext("2d");
    if (!blood) throw new Error("blood canvas unavailable");
    this.bloodCtx = blood;
    this.bloodTexture = new THREE.CanvasTexture(this.bloodCanvas);
    this.bloodMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.9),
      new THREE.MeshBasicMaterial({ map: this.bloodTexture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.bloodMesh.frustumCulled = false;
    this.bloodMesh.renderOrder = 22;
    this.mesh.visible = this.blackoutMesh.visible = this.bloodMesh.visible = false;
    this.drips = Array.from({ length: 9 }, () => this.newDrip(true));
  }
  get blackout() { return this.shown; }
  private redraw() {
    this.face = nextFaceIndex(FACE_COUNT, this.face, Math.random());
    drawFace(this.ctx, this.face);
    if (this.texture) this.texture.needsUpdate = true;
  }
  private newDrip(scattered: boolean) {
    return { x: 24 + Math.random() * 208, y: scattered ? Math.random() * 512 : -30 - Math.random() * 80, speed: 90 + Math.random() * 160, width: 3 + Math.random() * 5 };
  }
  private paintBlood(dt: number) {
    const ctx = this.bloodCtx;
    ctx.clearRect(0, 0, 256, 512);
    ctx.lineCap = "round";
    for (const drip of this.drips) {
      drip.y += drip.speed * dt;
      if (drip.y > 540) Object.assign(drip, this.newDrip(false));
      ctx.strokeStyle = "#9a0014";
      ctx.lineWidth = drip.width;
      ctx.beginPath();
      ctx.moveTo(drip.x, drip.y - 26);
      ctx.lineTo(drip.x, drip.y);
      ctx.stroke();
      ctx.fillStyle = "#ff1a22";
      ctx.beginPath();
      ctx.ellipse(drip.x, drip.y, drip.width * 0.7, drip.width * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    this.bloodTexture.needsUpdate = true;
  }
  update(seen: boolean, dt: number) {
    if (!this.cooling && this.hold === 0 && this.shown === 0 && seen) {
      this.redraw();
      this.hold = 3;
    }
    if (this.hold > 0) {
      this.hold = Math.max(0, this.hold - dt);
      if (this.hold === 0) this.cooling = true;
    }
    if (!seen) this.cooling = false;
    const target = this.hold > 0 ? 1 : 0;
    this.shown += (target - this.shown) * Math.min(1, dt * (target ? 18 : 8));
    if (target === 0 && this.shown < 0.03) this.shown = 0;
    const visible = this.shown > 0.03;
    this.mesh.visible = this.blackoutMesh.visible = this.bloodMesh.visible = visible;
    const z = -1.15 + this.shown * 0.78;
    this.mesh.position.set(0, -0.02, z);
    this.bloodMesh.position.set(0, -0.02, z + 0.03);
    const cover = this.blackoutMesh.material;
    if (!Array.isArray(cover)) cover.opacity = this.shown > 0.2 ? 1 : this.shown;
    if (visible) this.paintBlood(dt);
  }
  dispose() {
    for (const mesh of [this.mesh, this.bloodMesh, this.blackoutMesh]) {
      const material = mesh.material;
      if (!Array.isArray(material)) {
        if (material instanceof THREE.MeshBasicMaterial) material.map?.dispose();
        material.dispose();
      }
      mesh.geometry.dispose();
    }
  }
}
