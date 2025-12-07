vec2 draw() {
    vec2 localUV = p_uv;

    float left = p_sliceBorders.x;
    float right = p_sliceBorders.y;
    float top = p_sliceBorders.z;
    float bottom = p_sliceBorders.w;

    float leftPx = left * p_dimensions.x;
    float rightPx = right * p_dimensions.x;
    float topPx = top * p_dimensions.y;
    float bottomPx = bottom * p_dimensions.y;

    float lB = leftPx / p_dimensions.z;
    float rB = 1.0 - (rightPx / p_dimensions.z);
    float tB = topPx / p_dimensions.w;
    float bB = 1.0 - (bottomPx / p_dimensions.w);

    {
        float regionL = step(p_uv.x, lB);
        float regionR = step(rB, p_uv.x);
        float regionM = 1.0 - regionL - regionR;

        float xL = p_uv.x * (left / lB);
        float xR = 1.0 - right + ((p_uv.x - rB) / (1.0 - rB)) * right;
        float xM = left + ((p_uv.x - lB) / (rB - lB)) * (1.0 - left - right);

        localUV.x = regionL * xL + regionM * xM + regionR * xR;
    }

    {
        float regionT = step(p_uv.y, tB);
        float regionB = step(bB, p_uv.y);
        float regionC = 1.0 - regionT - regionB;

        float yT = p_uv.y * (top / tB);
        float yB = 1.0 - bottom + ((p_uv.y - bB) / (1.0 - bB)) * bottom;
        float yC = top + ((p_uv.y - tB) / (bB - tB)) * (1.0 - top - bottom);

        localUV.y = regionT * yT + regionC * yC + regionB * yB;
    }

    return texture(p_map, localUV) * p_color;
}
