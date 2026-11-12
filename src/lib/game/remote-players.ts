import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { teammateLook } from "./teammate-look";

export type RemoteBody = { id: string; x: number; y: number; z: number; yaw: number };
const loader = new GLTFLoader();
const templates = new Map<string, Promise<THREE.Object3D>>();

function loadTemplate(model: string) {
  let pending = templates.get(model);
  if (!pending) {
    pending = loader.loadAsync(`/teammates/${model}.glb`).then((gltf) => gltf.scene);
    templates.set(model, pending);
  }
  return pending;
}
function labelSprite(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#141208d8";
  ctx.fillRect(16, 8, 224, 48);
  ctx.fillStyle = "#fff6c8";
  ctx.font = "36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
  sprite.scale.set(0.72, 0.18, 1);
  sprite.position.y = 2.05;
  sprite.renderOrder = 6;
  return sprite;
}

export class RemotePlayers {
  private readonly meshes = new Map<string, THREE.Group>();
  private readonly seen = new Map<string, { x: number; z: number; at: number }>();
  previous(id: string) { return this.seen.get(id); }
  sync(scene: THREE.Scene, people: RemoteBody[], now: number) {
    const ids = new Set(people.map((person) => person.id));
    for (const [id, mesh] of this.meshes) {
      if (ids.has(id)) continue;
      scene.remove(mesh);
      this.disposeLabel(mesh);
      this.meshes.delete(id);
      this.seen.delete(id);
    }
    for (const person of people) {
      let mesh = this.meshes.get(person.id);
      if (!mesh) {
        const look = teammateLook(person.id);
        mesh = new THREE.Group();
        mesh.add(labelSprite(look.personality.label));
        mesh.userData.bob = look.personality.bob;
        scene.add(mesh);
        this.meshes.set(person.id, mesh);
        const group = mesh;
        void loadTemplate(look.model).then((source) => {
          if (this.meshes.get(person.id) !== group) return;
          const model = cloneSkinned(source);
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.frustumCulled = false;
            }
          });
          const bounds = new THREE.Box3().setFromObject(model);
          const height = Math.max(0.01, bounds.max.y - bounds.min.y);
          const scale = 1.7 / height;
          model.scale.setScalar(scale);
          model.position.y = -bounds.min.y * scale;
          group.add(model);
        }).catch(() => undefined);
      }
      const bob = Number(mesh.userData.bob) || 1;
      mesh.position.set(person.x, Math.sin(now / 1000 * bob + person.x) * 0.035, person.z);
      mesh.rotation.y = person.yaw + Math.PI;
      this.seen.set(person.id, { x: person.x, z: person.z, at: now });
    }
  }
  private disposeLabel(mesh: THREE.Group) {
    mesh.traverse((child) => {
      if (!(child instanceof THREE.Sprite)) return;
      child.material.map?.dispose();
      child.material.dispose();
    });
  }
  dispose(scene: THREE.Scene) {
    for (const mesh of this.meshes.values()) {
      scene.remove(mesh);
      this.disposeLabel(mesh);
    }
    this.meshes.clear();
  }
}
