import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import { adaptivePixelRatio, type visualProfile } from "@/game/core/visual-quality";

type Profile = ReturnType<typeof visualProfile>;

/**
 * Low-poly ink pass: draws a black outline wherever depth jumps (silhouettes,
 * building edges, characters) plus a lighter line where flat-shaded faces change
 * colour sharply. Lines fade with fog so distant scenery stays soft.
 */
const OutlineShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    texel: { value: new THREE.Vector2(1, 1) },
    cameraNear: { value: 0.5 },
    cameraFar: { value: 360 },
    fade: { value: new THREE.Vector2(34, 70) },
    ink: { value: new THREE.Color("#120c18") },
    strength: { value: 1 },
  },
  vertexShader:
    "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader: `#include <packing>
uniform sampler2D tDiffuse;uniform sampler2D tDepth;uniform vec2 texel;uniform float cameraNear;uniform float cameraFar;
uniform vec2 fade;uniform vec3 ink;uniform float strength;varying vec2 vUv;
float viewZ(vec2 uv){float d=texture2D(tDepth,uv).x;return -perspectiveDepthToViewZ(d,cameraNear,cameraFar);}
float lum(vec2 uv){return dot(texture2D(tDiffuse,uv).rgb,vec3(.2126,.7152,.0722));}
void main(){
  vec4 base=texture2D(tDiffuse,vUv);
  float c=viewZ(vUv);
  vec2 dx=vec2(texel.x,0.),dy=vec2(0.,texel.y);
  float l=viewZ(vUv-dx),r=viewZ(vUv+dx),u=viewZ(vUv+dy),d=viewZ(vUv-dy);
  float near=min(min(min(l,r),min(u,d)),c);
  float depthEdge=(abs(l-c)+abs(r-c)+abs(u-c)+abs(d-c))/max(near,.001);
  float edge=smoothstep(.055,.13,depthEdge);
  float lc=lum(vUv);
  float colourEdge=abs(lum(vUv-dx)-lc)+abs(lum(vUv+dx)-lc)+abs(lum(vUv+dy)-lc)+abs(lum(vUv-dy)-lc);
  edge=max(edge,smoothstep(.34,.6,colourEdge)*.55);
  float distanceFade=1.0-smoothstep(fade.x*.7,fade.y,near);
  if(c>cameraFar*.98&&near>cameraFar*.98)edge=0.0;
  base.rgb=mix(base.rgb,ink,clamp(edge*distanceFade*strength,0.0,1.0));
  // Gentle grade carried over from the previous cinematic pass.
  float g=dot(base.rgb,vec3(.2126,.7152,.0722));
  base.rgb=mix(vec3(g),base.rgb,1.1)*vec3(1.02,1.008,.98);
  gl_FragColor=vec4(max(base.rgb,vec3(0.0)),base.a);
}`,
};

class OutlinePass extends Pass {
  material: THREE.ShaderMaterial;
  quad: FullScreenQuad;
  constructor(private camera: THREE.Camera, private scene: THREE.Scene) {
    super();
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(OutlineShader.uniforms),
      vertexShader: OutlineShader.vertexShader,
      fragmentShader: OutlineShader.fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.material);
  }
  setSize(width: number, height: number) {
    this.material.uniforms.texel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
  }
  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    const u = this.material.uniforms;
    u.tDiffuse.value = readBuffer.texture;
    u.tDepth.value = readBuffer.depthTexture;
    const cam = this.camera as THREE.PerspectiveCamera;
    u.cameraNear.value = cam.near ?? 0.5;
    u.cameraFar.value = cam.far ?? 360;
    const fog = this.scene.fog as THREE.Fog | null;
    if (fog && "near" in fog) u.fade.value.set(fog.near, fog.far);
    else u.fade.value.set(cam.far * 0.6, cam.far);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() {
    this.material.dispose();
    this.quad.dispose();
  }
}

/** Every material becomes faceted (flat-shaded) once; cheap to re-check periodically. */
export function lowPolyMaterials(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of list) {
      if (!m || m.userData.lowPoly) continue;
      m.userData.lowPoly = true;
      const s = m as THREE.MeshStandardMaterial;
      if ("flatShading" in s && !(m as THREE.SpriteMaterial).isSpriteMaterial && !s.transparent) {
        s.flatShading = true;
        if ("envMapIntensity" in s) s.envMapIntensity = Math.min(s.envMapIntensity ?? 1, 0.2);
        m.needsUpdate = true;
      }
    }
  });
}

/** Low-poly presentation with ink outlines, adaptive resolution and one tone-map/output conversion. */
export function cinematicRenderer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  profile: Profile,
) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = profile.exposure;
  let environment: THREE.WebGLRenderTarget | null = null;
  const cleanup: Array<() => void> = [];
  const dispose = () => {
    for (const release of cleanup.reverse()) release();
    cleanup.length = 0;
    if (scene.environment === environment?.texture) scene.environment = null;
  };
  let width = 1,
    height = 1,
    frames = 0;
  const adapt = adaptivePixelRatio(profile.pixelRatio, profile.minPixelRatio);
  let applySize = (_w: number, _h: number) => {};
  const tick = (frameMs: number) => {
    if (++frames % 120 === 0) lowPolyMaterials(scene);
    const next = adapt(frameMs);
    if (next !== null) {
      renderer.setPixelRatio(next);
      renderer.setSize(width, height, false);
      applySize(width, height);
    }
  };
  try {
    if (profile.environment) {
      const generator = new THREE.PMREMGenerator(renderer),
        room = new RoomEnvironment();
      try {
        environment = generator.fromScene(room, 0.04);
        cleanup.push(() => environment?.dispose());
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.25;
      } finally {
        room.dispose();
        generator.dispose();
      }
    }
    if (!profile.postProcessing)
      return {
        render: (frameMs = 16) => {
          tick(frameMs);
          renderer.render(scene, camera);
        },
        resize: (w: number, h: number) => {
          width = w;
          height = h;
        },
        dispose,
      };
    const hdr = profile.bloom && renderer.extensions.has("EXT_color_buffer_float");
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
      depthBuffer: true,
    });
    // The outline reads scene depth; MSAA depth resolve is not portable, so FXAA smooths instead.
    target.depthTexture = new THREE.DepthTexture(1, 1);
    target.depthTexture.type = THREE.UnsignedIntType;
    cleanup.push(() => target.dispose());
    const composer = new EffectComposer(renderer, target);
    cleanup.push(() => composer.dispose());
    // A cloned DepthTexture shares its GPU source; give the second buffer its own
    // so reading depth never samples the framebuffer being drawn into.
    const ownDepth = new THREE.DepthTexture(1, 1);
    ownDepth.type = THREE.UnsignedIntType;
    composer.renderTarget2.depthTexture = ownDepth;
    const render = new RenderPass(scene, camera);
    composer.addPass(render);
    cleanup.push(() => render.dispose());
    const bloom = hdr
      ? new UnrealBloomPass(new THREE.Vector2(1, 1), profile.bloomStrength, 0.45, 1.05)
      : null;
    if (bloom) {
      composer.addPass(bloom);
      cleanup.push(() => bloom.dispose());
    }
    const outline = new OutlinePass(camera, scene);
    composer.addPass(outline);
    cleanup.push(() => outline.dispose());
    const output = new OutputPass();
    composer.addPass(output);
    cleanup.push(() => output.dispose());
    const aa = new ShaderPass(FXAAShader);
    composer.addPass(aa);
    cleanup.push(() => aa.dispose());
    applySize = (w, h) => {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(Math.max(1, w), Math.max(1, h));
      const pr = renderer.getPixelRatio();
      aa.uniforms.resolution.value.set(1 / (Math.max(1, w) * pr), 1 / (Math.max(1, h) * pr));
    };
    return {
      render: (frameMs = 16) => {
        tick(frameMs);
        composer.render();
      },
      resize: (w: number, h: number) => {
        width = Math.max(1, w);
        height = Math.max(1, h);
        applySize(width, height);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
