import type { UIColor } from "../../core";
import type { UIParticleProperty, UIParticlePropertyName } from "../instancedParticle/shared";
import { UIRenderingModule } from "./UIRenderingModule";

export class UIColorOverLifeRenderingModule extends UIRenderingModule {
  public override readonly requiredProperties: Record<string, UIParticlePropertyName> = {
    lifetime: "Vector2",
  } as const;
  public readonly requiredUniforms: Record<string, UIParticleProperty>;
  public readonly source: string;

  constructor(colors: UIColor[]) {
    super();

    if (colors.length === 0) {
      throw new Error("UIColorOverLifeRenderingModule: colors array cannot be empty");
    }

    this.requiredUniforms = {};

    // Generate shader with embedded colors
    const colorCount = colors.length;
    const colorDefinitions = colors
      .map((color, index) => {
        return `  const vec4 color${index} = vec4(${color.r.toFixed(6)}, ${color.g.toFixed(6)}, ${color.b.toFixed(6)}, ${color.a.toFixed(6)});`;
      })
      .join("\n");

    let interpolationCode: string;

    if (colorCount === 1) {
      interpolationCode = "  return color0;";
    } else {
      // Generate interpolation code
      const steps: string[] = [];

      for (let i = 0; i < colorCount - 1; i++) {
        const t0 = i / (colorCount - 1);
        const t1 = (i + 1) / (colorCount - 1);

        if (i === 0) {
          steps.push(`  if (t < ${t1.toFixed(6)}) {`);
        } else {
          steps.push(`  else if (t < ${t1.toFixed(6)}) {`);
        }

        steps.push(`    float localT = (t - ${t0.toFixed(6)}) / ${(t1 - t0).toFixed(6)};`);
        steps.push(`    return mix(color${i}, color${i + 1}, localT);`);
        steps.push(`  }`);
      }

      steps.push(`  return color${colorCount - 1};`);

      interpolationCode = steps.join("\n");
    }

    this.source = `
vec4 draw() {
${colorDefinitions}

  float t = clamp(p_lifetime.y / p_lifetime.x, 0.0, 1.0);

${interpolationCode}
}
`;
  }
}
