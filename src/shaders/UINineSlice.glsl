// Required properties:
// - p_uv: vec2 (builtin)
// - p_texture: sampler2D
// - p_color: vec4
// - p_sliceBorders: vec4 (x: left, y: right, z: top, w: bottom)
// - p_sliceRegions: vec4 (x: left, y: right, z: top, w: bottom)

vec4 draw() {
    vec2 localUV = p_uv;

    // Original borders (percentages of texture)
    float left = p_sliceBorders.x;
    float right = p_sliceBorders.y;
    float top = p_sliceBorders.z;
    float bottom = p_sliceBorders.w;

    // Extended mapping controls (percentages of element size to fill)
    float leftFill = p_sliceRegions.x;
    float rightFill = p_sliceRegions.y;
    float topFill = p_sliceRegions.z;
    float bottomFill = p_sliceRegions.w;

    // Calculate boundaries in element space
    float lB = leftFill;
    float rB = 1.0 - rightFill;
    float tB = topFill;
    float bB = 1.0 - bottomFill;

    // Horizontal mapping
    {
        float regionL = step(p_uv.x, lB);
        float regionR = step(rB, p_uv.x);
        float regionM = 1.0 - regionL - regionR;

        float xL = (p_uv.x / lB) * left;
        float xR = 1.0 - right + ((p_uv.x - rB) / rightFill) * right;
        float xM = left + ((p_uv.x - lB) / (rB - lB)) * (1.0 - left - right);

        localUV.x = regionL * xL + regionM * xM + regionR * xR;
    }

    // Vertical mapping
    {
        float regionT = step(p_uv.y, tB);
        float regionB = step(bB, p_uv.y);
        float regionC = 1.0 - regionT - regionB;

        float yT = (p_uv.y / tB) * top;
        float yB = 1.0 - bottom + ((p_uv.y - bB) / bottomFill) * bottom;
        float yC = top + ((p_uv.y - tB) / (bB - tB)) * (1.0 - top - bottom);

        localUV.y = regionT * yT + regionC * yC + regionB * yB;
    }

    return texture2D(p_texture, localUV) * p_color;
}
