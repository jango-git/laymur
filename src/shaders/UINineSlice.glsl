// Required properties:
// - p_uv: vec2 (builtin)
// - p_texture: sampler2D
// - p_textureTransform: mat3
// - p_color: vec4
// - p_sliceBorders: vec4
// - p_sliceRegions: vec4

vec4 draw() {
    vec2 localUV = p_uv;

    float left = p_sliceBorders.x;
    float right = p_sliceBorders.y;
    float top = p_sliceBorders.z;
    float bottom = p_sliceBorders.w;

    float leftFill = p_sliceRegions.x;
    float rightFill = p_sliceRegions.y;
    float topFill = p_sliceRegions.z;
    float bottomFill = p_sliceRegions.w;

    float lB = leftFill;
    float rB = 1.0 - rightFill;
    float bB = bottomFill;
    float tB = 1.0 - topFill;

    {
        float regionL = step(p_uv.x, lB);
        float regionR = step(rB, p_uv.x);
        float regionM = 1.0 - regionL - regionR;

        float xL = (p_uv.x / lB) * left;
        float xR = 1.0 - right + ((p_uv.x - rB) / rightFill) * right;
        float xM = left + ((p_uv.x - lB) / (rB - lB)) * (1.0 - left - right);

        localUV.x = regionL * xL + regionM * xM + regionR * xR;
    }

    {
        float regionB = step(p_uv.y, bB);
        float regionT = step(tB, p_uv.y);
        float regionC = 1.0 - regionB - regionT;

        float yB = (p_uv.y / bB) * bottom;
        float yT = 1.0 - top + ((p_uv.y - tB) / topFill) * top;
        float yC = bottom + ((p_uv.y - bB) / (tB - bB)) * (1.0 - bottom - top);

        localUV.y = regionB * yB + regionC * yC + regionT * yT;
    }

    vec2 transformedUV = (p_textureTransform * vec3(localUV, 1.0)).xy;
    return texture2D(p_texture, transformedUV) * p_color;
}
