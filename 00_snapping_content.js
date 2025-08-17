import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Clock,
  TextureLoader,
  BoxGeometry,
  MeshLambertMaterial,
  Mesh,
  SRGBColorSpace,
} from "https://esm.sh/three@0.175?min";
import {
  UIFullscreenLayer,
  UIImage,
  UIHorizontalDistanceConstraint,
  UIVerticalDistanceConstraint,
} from "https://esm.sh/laymur@0.2.2?deps=three@0.175&min";

let renderer;
let layer;
let scene;
let camera;
let cube;
let loadedTextures = {};
let clock = new Clock();

async function loadAssets() {
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

async function buildScene() {
  // Load assets first
  await loadAssets();

  // Create renderer
  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.autoClear = false;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x111111, 1);

  // Add canvas to body
  document.body.appendChild(renderer.domElement);

  // Create scene
  scene = new Scene();
  scene.background = new Color("darkgray");

  // Create camera
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 5;

  // Create cube
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshLambertMaterial({ color: 0x00ff00 });
  cube = new Mesh(geometry, material);
  scene.add(cube);

  // Add sun (hemisphere and directional light)
  const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(hemisphereLight);

  const directionalLight = new DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Create layer
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

  // Setup resize handling
  window.addEventListener("resize", handleResize);

  // Start render loop
  animate();
}

function handleResize() {
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

  // Rotate cube
  if (cube) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.rotation.z += 0.01;
  }

  // Render scene
  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  }

  if (layer && renderer) {
    const deltaTime = clock.getDelta();
    layer.render(renderer, deltaTime);
  }
}

window.addEventListener("load", buildScene);
