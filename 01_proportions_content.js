import {
  Scene,
  WebGLRenderer,
  Clock,
  TextureLoader,
  SRGBColorSpace,
  EquirectangularReflectionMapping,
} from "https://esm.sh/three@0.175?min";
import {
  UIFullscreenLayer,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
  UIAspectConstraint,
  UIHorizontalProportionConstraint,
  UIVerticalProportionConstraint,
  UIRelation,
  UIOrientation,
} from "https://esm.sh/laymur@0.2.2?deps=three@0.175&min";
import { GLTFLoader } from "https://esm.sh/three@0.175/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "https://esm.sh/three@0.175.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://esm.sh/three@0.175/examples/jsm/loaders/RGBELoader";

let renderer;
let layer;
let scene;
let camera;
let originalCameraPosition = { x: 0, y: 0, z: 0 };
let originalCameraRotation = { x: 0, y: 0, z: 0 };
const loadedTextures = {};
const loader = new GLTFLoader();
const clock = new Clock();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
loader.setDRACOLoader(dracoLoader);

async function loadTextures() {
  const loader = new TextureLoader();
  const assetPaths = [
    "assets/T_Character.webp",
    "assets/T_Download.webp",
    "assets/T_Logotype.webp",
  ];

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

async function loadEnvironment() {
  const rgbeLoader = new RGBELoader();

  return new Promise((resolve, reject) => {
    rgbeLoader.load(
      "assets/T_Environment.hdr",
      (texture) => {
        texture.mapping = EquirectangularReflectionMapping;
        loadedTextures["T_Environment"] = texture;
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error("Failed to load environment:", error);
        reject(error);
      },
    );
  });
}

async function loadTerrain() {
  loader.setPath("assets/").load("SM_Terrain.glb", (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    camera = gltf.cameras[0];

    // Store original camera transform
    originalCameraPosition.x = camera.position.x;
    originalCameraPosition.y = camera.position.y;
    originalCameraPosition.z = camera.position.z;
    originalCameraRotation.x = camera.rotation.x;
    originalCameraRotation.y = camera.rotation.y;
    originalCameraRotation.z = camera.rotation.z;

    onResize();
  });
}

async function buildScene() {
  {
    scene = new Scene();
  }

  await loadTextures();
  await loadEnvironment();
  await loadTerrain();

  {
    const rotation = Math.PI * 0.5;
    const texture = loadedTextures["T_Environment"];
    scene.background = texture;
    scene.backgroundRotation.y = rotation;
    scene.environment = texture;
    scene.environmentRotation.y = rotation;
  }

  layer = new UIFullscreenLayer(1920, 1920);

  {
    const character = new UIImage(layer, loadedTextures["T_Character"]);

    new UIAspectConstraint(character);

    new UIHorizontalDistanceConstraint(layer, character, {
      anchorA: 0,
      anchorB: 0,
      distance: 25,
    });

    new UIVerticalDistanceConstraint(character, layer, {
      anchorA: 0,
      anchorB: 0,
      distance: 0,
    });

    new UIHorizontalProportionConstraint(layer, character, {
      proportion: 0.45,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, character, {
      proportion: 0.75,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  {
    const logotype = new UIImage(layer, loadedTextures["T_Logotype"]);

    new UIAspectConstraint(logotype);

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

    new UIHorizontalProportionConstraint(layer, logotype, {
      proportion: 0.25,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, logotype, {
      proportion: 0.15,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.HORIZONTAL,
    });
  }

  {
    const download = new UIImage(layer, loadedTextures["T_Download"]);

    new UIAspectConstraint(download);

    new UIHorizontalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIVerticalDistanceConstraint(download, layer, {
      anchorA: 1,
      anchorB: 1,
      distance: 50,
    });

    new UIHorizontalProportionConstraint(layer, download, {
      proportion: 0.4,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.VERTICAL,
    });

    new UIVerticalProportionConstraint(layer, download, {
      proportion: 0.15,
      relation: UIRelation.GREATER_THAN,
      orientation: UIOrientation.HORIZONTAL,
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

  // Add subtle camera sway
  if (camera && originalCameraPosition) {
    const time = clock.getElapsedTime();
    const swayIntensity = 0.1;
    const swaySpeed = 0.5;

    // Subtle position sway
    camera.position.x =
      originalCameraPosition.x + Math.sin(time * swaySpeed) * swayIntensity;
    camera.position.y =
      originalCameraPosition.y +
      Math.cos(time * swaySpeed * 0.7) * swayIntensity * 0.5;

    // Subtle rotation sway
    camera.rotation.z =
      originalCameraRotation.z + Math.sin(time * swaySpeed * 0.8) * 0.005;
  }

  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  }

  if (layer && renderer) {
    const deltaTime = clock.getDelta();
    layer.render(renderer, deltaTime);
  }
}

window.addEventListener("load", buildScene);
