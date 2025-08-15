import type { Texture } from "three";
import { Color, ShaderMaterial, UniformsUtils } from "three";

export class UIProgressMaterial extends ShaderMaterial {
  constructor(foregroundTexture: Texture, backgroundTexture?: Texture) {
    super({
      uniforms: UniformsUtils.merge([
        {
          background: { value: backgroundTexture },
          foreground: { value: foregroundTexture },
          progress: { value: 1 },
          backgroundColor: { value: new Color(1, 1, 1) },
          foregroundColor: { value: new Color(1, 1, 1) },
          color: { value: new Color(1, 1, 1) },
          backgroundOpacity: { value: 1 },
          foregroundOpacity: { value: 1 },
          opacity: { value: 1 },
          angle: { value: 0 },
          direction: { value: 1 },
        },
      ]),
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D background;
        uniform sampler2D foreground;
        uniform float progress;
        uniform vec3 backgroundColor;
        uniform vec3 foregroundColor;
        uniform vec3 color;
        uniform float backgroundOpacity;
        uniform float foregroundOpacity;
        uniform float opacity;
        uniform float angle;
        uniform float direction;
        varying vec2 vUv;

        void main() {
          vec4 backgroundTexture = texture2D(background, vUv);
          vec4 foregroundTexture = texture2D(foreground, vUv);

          // Apply common color and opacity
          vec3 finalBackgroundColor = backgroundTexture.rgb * backgroundColor * color;
          vec3 finalForegroundColor = foregroundTexture.rgb * foregroundColor * color;
          float finalBackgroundOpacity = backgroundTexture.a * backgroundOpacity * opacity;
          float finalForegroundOpacity = foregroundTexture.a * foregroundOpacity * opacity;

          vec4 backgroundColor = vec4(finalBackgroundColor, finalBackgroundOpacity);
          vec4 foregroundColor = vec4(finalForegroundColor, finalForegroundOpacity);

          // Calculate progress threshold with angle and direction
          float adjustedX = mix(vUv.x, 1.0 - vUv.x, step(0.0, -direction));
          float tanAngle = tan(angle);
          float threshold = adjustedX - (vUv.y - 0.5) * tanAngle * sign(direction);
          float progressMask = smoothstep(threshold - 0.01, threshold + 0.01, progress);

          gl_FragColor = mix(backgroundColor, foregroundColor, progressMask);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      lights: false,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });
  }

  public getProgress(): number {
    return this.uniforms.progress.value;
  }

  public getBackgroundTexture(): Texture | undefined {
    return this.uniforms.background.value;
  }

  public getForegroundTexture(): Texture {
    return this.uniforms.foreground.value;
  }

  public getBackgroundColor(): number {
    return (this.uniforms.color.value as Color).getHex();
  }

  public getForegroundColor(): number {
    return (this.uniforms.color.value as Color).getHex();
  }

  public getBackgroundOpacity(): number {
    return this.uniforms.backgroundOpacity.value;
  }

  public getForegroundOpacity(): number {
    return this.uniforms.foregroundOpacity.value;
  }

  public getAngle(): number {
    return this.uniforms.angle.value;
  }

  public getIsForwardDirection(): boolean {
    return this.uniforms.direction.value === 1;
  }

  public setProgress(value: number): void {
    this.uniforms.progress.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundTexture(value: Texture | undefined): void {
    this.uniforms.background.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setForegroundTexture(value: Texture): void {
    this.uniforms.foreground.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundColor(value: number): void {
    (this.uniforms.color.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
  }

  public setForegroundColor(value: number): void {
    (this.uniforms.color.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundOpacity(value: number): void {
    this.uniforms.backgroundOpacity.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setForegroundOpacity(value: number): void {
    this.uniforms.foregroundOpacity.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setAngle(value: number): void {
    this.uniforms.angle.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setIsForwardDirection(value: boolean): void {
    this.uniforms.direction.value = value ? 1 : -1;
    this.uniformsNeedUpdate = true;
  }
}
