import {
  Scene,
  WebGLRenderer,
  Clock,
  TextureLoader,
  MeshLambertMaterial,
  SRGBColorSpace,
  EquirectangularReflectionMapping,
} from "https://esm.sh/three@0.157?min";
import { GLTFLoader } from "https://esm.sh/three@0.157/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "https://esm.sh/three@0.157/examples/jsm/loaders/DRACOLoader";
import { RGBELoader } from "https://esm.sh/three@0.157/examples/jsm/loaders/RGBELoader";

export class BaseScene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.originalCameraPosition = { x: 0, y: 0, z: 0 };
    this.originalCameraRotation = { x: 0, y: 0, z: 0 };
    this.loadedTextures = {};
    this.loader = new GLTFLoader();
    this.clock = new Clock();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    this.loader.setDRACOLoader(dracoLoader);
  }

  async loadTextures(assetPaths) {
    const loader = new TextureLoader();

    try {
      const promises = assetPaths.map((path) => {
        return new Promise((resolve, reject) => {
          loader.load(
            path,
            (texture) => {
              const fileName = path.split("/").pop().split(".")[0];
              this.loadedTextures[fileName] = texture;
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

  async loadEnvironment() {
    const rgbeLoader = new RGBELoader();

    return new Promise((resolve, reject) => {
      rgbeLoader.load(
        "assets/T_Environment.hdr",
        (texture) => {
          texture.mapping = EquirectangularReflectionMapping;
          this.loadedTextures["T_Environment"] = texture;
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

  async loadTerrain() {
    return new Promise((resolve) => {
      this.loader.setPath("assets/").load("SM_Terrain.glb", (gltf) => {
        const model = gltf.scene;
        this.scene.add(model);
        this.camera = gltf.cameras[0];

        // Store original camera transform
        this.originalCameraPosition.x = this.camera.position.x;
        this.originalCameraPosition.y = this.camera.position.y;
        this.originalCameraPosition.z = this.camera.position.z;
        this.originalCameraRotation.x = this.camera.rotation.x;
        this.originalCameraRotation.y = this.camera.rotation.y;
        this.originalCameraRotation.z = this.camera.rotation.z;

        this.onResize();
        const terrain = model.getObjectByName("SM_Terrain");
        const material = new MeshLambertMaterial({ color: 0x00ff00 });
        terrain.material = material;
        resolve();
      });
    });
  }

  async initScene() {
    this.scene = new Scene();

    await this.loadEnvironment();
    await this.loadTerrain();

    // Set environment as scene background
    {
      const texture = this.loadedTextures["T_Environment"];
      this.scene.background = texture;
      this.scene.environment = texture;
    }
  }

  initRenderer() {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    this.renderer.autoClear = false;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x111111, 1);
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  updateCameraSway() {
    // Add subtle camera sway
    if (this.camera && this.originalCameraPosition) {
      const time = this.clock.getElapsedTime();
      const swayIntensity = 0.025;
      const swaySpeed = 0.8;

      // Subtle position sway
      this.camera.position.x =
        this.originalCameraPosition.x +
        Math.sin(time * swaySpeed) * swayIntensity;
      this.camera.position.y =
        this.originalCameraPosition.y +
        Math.cos(time * swaySpeed * 0.7) * swayIntensity * 0.5;

      // Subtle rotation sway
      this.camera.rotation.z =
        this.originalCameraRotation.z +
        Math.sin(time * swaySpeed * 0.8) * 0.005;
      this.camera.rotation.y =
        this.originalCameraRotation.y + Math.sin(time * swaySpeed * 0.8) * 0.01;
    }
  }

  render() {
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getDeltaTime() {
    return this.clock.getDelta();
  }
}
