import { Texture } from "three";
import { UIAspectConstraint } from "./Constraints/UIAspectConstraint";
import { UIConstraint } from "./Constraints/UIConstraint";
import { UIConstraintPower } from "./Constraints/UIConstraintPower";
import { UIConstraintRule } from "./Constraints/UIConstraintRule";
import { UIHeightConstraint } from "./Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "./Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "./Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "./Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "./Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "./Constraints/UIWidthConstraint";
import { UIElement } from "./Elements/UIElement";
import { UIImage } from "./Elements/UIImage";
import { UILayer } from "./UILayer";

export interface UIBuilderElementDescription {
  keepWidth?: boolean;
  keepWidthRule?: UIConstraintRule;

  keepHeight?: number;
  keepHeightRule?: UIConstraintRule;

  keepAspect?: boolean;
  keepAspectRule?: UIConstraintRule;
}

export interface UIBuilderImageDescription extends UIBuilderElementDescription {
  texture: Texture;
}

export interface UIBuilderTextDescription extends UIBuilderElementDescription {
  text: string;
}

function isUIImageDescription(
  desc: UIBuilderElementDescription,
): desc is UIBuilderImageDescription {
  return "texture" in desc;
}

function isUITextDescription(
  desc: UIBuilderElementDescription,
): desc is UIBuilderTextDescription {
  return "text" in desc;
}

type Value2D = { x?: number; y?: number };
type Rule2D = { x?: UIConstraintRule; y?: UIConstraintRule };
type Power2D = { x?: UIConstraintPower; y?: UIConstraintPower };

export interface UIBuilderConstraintDescription {
  elementOneName: string;
  elementTwoName: string;

  elementOneAnchor?: Value2D;
  elementTwoAnchor?: Value2D;

  distance?: Value2D;
  proportion?: Value2D;

  distanceRule?: Rule2D;
  proportionRule?: Rule2D;

  distancePower?: Power2D;
  proportionPower?: Power2D;
}

type AnyElementDescription =
  | UIBuilderImageDescription
  | UIBuilderTextDescription;
type AnyConstraintDescription = UIBuilderConstraintDescription;

export interface UIBuilderDescription {
  name: string;
  elements: Record<string, AnyElementDescription>;
  constraints?: Record<string, AnyConstraintDescription>;
}

export interface UIBuilderResult {
  layer: UILayer;
  elements: Record<string, UIElement>;
  constraints: Record<string, UIConstraint>;
}

export class UIBuilder {
  public static fromDescription(
    description: UIBuilderDescription,
  ): UIBuilderResult {
    const layerName = description.name;
    const layer = new UILayer();
    const elements: Map<string, UIElement> = new Map();
    const constraints: Map<string, UIConstraint> = new Map();

    for (const key of Object.keys(description.elements)) {
      if (elements.has(key)) throw new Error("Double key");

      const value = description.elements[key];
      let element: UIElement;

      if (isUIImageDescription(value)) {
        element = new UIImage(layer, value.texture);
        elements.set(key, element);
      } else if (isUITextDescription(value)) {
        throw new Error("UIText still not implemented");
      } else {
        throw new Error("Unknown ui element type");
      }

      if (value.keepWidth) {
        constraints.set(
          `${key}WidthConstraint`,
          new UIWidthConstraint(element, {
            width: element.width,
            rule: value.keepWidthRule,
          }),
        );
      }

      if (value.keepHeight) {
        constraints.set(
          `${key}HeightConstraint`,
          new UIHeightConstraint(element, {
            height: element.height,
            rule: value.keepHeightRule,
          }),
        );
      }

      if (value.keepAspect) {
        constraints.set(
          `${key}AspectConstraint`,
          new UIAspectConstraint(element, {
            rule: value.keepAspectRule,
          }),
        );
      }
    }

    const constraintsDescription = description.constraints ?? {};

    for (const key of Object.keys(constraintsDescription)) {
      if (constraints.has(key)) throw new Error("Double key");
      const value = constraintsDescription[key];

      const elementOne =
        value.elementOneName === layerName
          ? layer
          : elements.get(value.elementOneName);
      const elementTwo = elements.get(value.elementTwoName);

      if (!elementOne || !elementTwo) throw new Error("Element not found");

      if (value.distance?.x !== undefined) {
        constraints.set(
          key,
          new UIHorizontalDistanceConstraint(elementOne, elementTwo, {
            anchorOne: value.elementOneAnchor?.x,
            anchorTwo: value.elementTwoAnchor?.x,
            distance: value.distance.x,
            power: value.distancePower?.x,
            rule: value.distanceRule?.x,
          }),
        );
      }

      if (value.distance?.y !== undefined) {
        constraints.set(
          key,
          new UIVerticalDistanceConstraint(elementOne, elementTwo, {
            anchorOne: value.elementOneAnchor?.y,
            anchorTwo: value.elementTwoAnchor?.y,
            distance: value.distance.y,
            power: value.distancePower?.y,
            rule: value.distanceRule?.y,
          }),
        );
      }

      if (value.proportion?.x !== undefined) {
        constraints.set(
          key,
          new UIHorizontalProportionConstraint(elementOne, elementTwo, {
            proportion: value.proportion.x,
            power: value.proportionPower?.x,
            rule: value.proportionRule?.x,
          }),
        );
      }

      if (value.proportion?.y !== undefined) {
        constraints.set(
          key,
          new UIVerticalProportionConstraint(elementOne, elementTwo, {
            proportion: value.proportion.y,
            power: value.proportionPower?.y,
            rule: value.proportionRule?.y,
          }),
        );
      }
    }

    return {
      layer,
      elements: Object.fromEntries(elements),
      constraints: Object.fromEntries(constraints),
    };
  }
}
