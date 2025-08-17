import {
  Scene,
  Color,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Clock,
  TextureLoader,
  MeshLambertMaterial,
  SRGBColorSpace,
} from "https://esm.sh/three@0.175?min";
import {
  UIFullscreenLayer,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
} from "https://esm.sh/laymur@0.2.2?deps=three@0.175&min";
import { GLTFLoader } from "https://esm.sh/three@0.175/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "https://esm.sh/three@0.175.0/examples/jsm/loaders/DRACOLoader.js";

let renderer;
let layer;
let scene;
let camera;
const loadedTextures = {};
const loader = new GLTFLoader();
const clock = new Clock();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
loader.setDRACOLoader(dracoLoader);

async function loadTextures() {
  const loader = new TextureLoader();
  const assetPaths = ["assets/T_Download.webp", "assets/T_Logotype.webp"];

  try {
    const promises = assetPaths.map((path) => {
      return new Promise((resolve, reject) => {
        loader.load(
          path,
          (texture) => {
            const fileName = path.split("/").pop().split(".")[0];
            loadedTextures[fileName] = texture;
            texture.colorSpace = SRGBColorSpace;
            resolve(texture);
          },
          undefined,
          (error) => {
            console.error(`Failed to load ${path}:`, error);
            reject(error);
          },
        );
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error loading assets:", error);
  }
}

async function loadModels() {
  loader.setPath("assets/").load("SM_Terrain.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    camera = gltf.cameras[0];
    onResize();
    const terrain = model.getObjectByName("SM_Terrain");
    const material = new MeshLambertMaterial({ color: 0x00ff00 });
    terrain.material = material;
  });
}

async function buildScene() {
  {
    scene = new Scene();
    scene.background = new Color(0x87ceeb);
  }

  await loadTextures();
  await loadModels();

  {
    const hemisphere = new HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(hemisphere);

    const sun = new DirectionalLight(0xffffff, 2);
    sun.position.set(5, 5, 5);
    scene.add(sun);
  }

  layer = new UIFullscreenLayer(1920, 1920);

  {
    const logotype = new UIImage(layer, loadedTextures["T_Logotype"]);

    new UIHorizontalDistanceConstraint(layer, logotype, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(logotype, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });
  }

  {
    const download = new UIImage(layer, loadedTextures["T_Download"]);

    new UIHorizontalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(layer, download, {
      anchorA: 0,
      anchorB: 0,
      distance: 50,
    });
  }

  {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x111111, 1);
    document.body.appendChild(renderer.domElement);
  }

  window.addEventListener("resize", onResize);
  animate();
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  }

  if (layer && renderer) {
    const deltaTime = clock.getDelta();
    layer.render(renderer, deltaTime);
  }
}

window.addEventListener("load", buildScene);
