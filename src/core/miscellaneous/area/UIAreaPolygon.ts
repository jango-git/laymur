import { assertValidNumber } from "../asserts";
import type { Vector2Like } from "../math";
import { UIArea } from "./UIArea";

/** Polygonal interaction area using ray casting */
export class UIAreaPolygon extends UIArea {
  /**
   * Creates polygonal area.
   *
   * @param vertices - Vertices in normalized coordinates (0 to 1)
   */
  constructor(public vertices: Vector2Like[]) {
    super();
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    assertValidNumber(pointX, "UIAreaPolygon.contains.pointX");
    assertValidNumber(pointY, "UIAreaPolygon.contains.pointY");
    const vertexCount = this.vertices.length;
    if (vertexCount < 3) {
      return false;
    }

    let inside = false;

    for (
      let index = 0, previousIndex = vertexCount - 1;
      index < vertexCount;
      previousIndex = index++
    ) {
      const currentVertex = this.vertices[index];
      const previousVertex = this.vertices[previousIndex];

      const currentX = currentVertex.x;
      const currentY = currentVertex.y;
      const previousX = previousVertex.x;
      const previousY = previousVertex.y;

      if (
        currentY > pointY !== previousY > pointY &&
        pointX < ((previousX - currentX) * (pointY - currentY)) / (previousY - currentY) + currentX
      ) {
        inside = !inside;
      }
    }

    return inside;
  }
}
