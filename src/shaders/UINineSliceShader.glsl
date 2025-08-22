vec2 calculateNineSliceUV() {
    vec2 localUV = io_UV;

    float left = sliceBorders.x;
    float right = sliceBorders.y;
    float top = sliceBorders.z;
    float bottom = sliceBorders.w;

    float leftPx = left * dimensions.x;
    float rightPx = right * dimensions.x;
    float topPx = top * dimensions.y;
    float bottomPx = bottom * dimensions.y;

    float lB = leftPx / dimensions.z;
    float rB = 1.0 - (rightPx / dimensions.z);
    float tB = topPx / dimensions.w;
    float bB = 1.0 - (bottomPx / dimensions.w);

    {
        float regionL = step(io_UV.x, lB);
        float regionR = step(rB, io_UV.x);
        float regionM = 1.0 - regionL - regionR;

        float xL = io_UV.x * (left / lB);
        float xR = 1.0 - right + ((io_UV.x - rB) / (1.0 - rB)) * right;
        float xM = left + ((io_UV.x - lB) / (rB - lB)) * (1.0 - left - right);

        localUV.x = regionL * xL + regionM * xM + regionR * xR;
    }

    {
        float regionT = step(io_UV.y, tB);
        float regionB = step(bB, io_UV.y);
        float regionC = 1.0 - regionT - regionB;

        float yT = io_UV.y * (top / tB);
        float yB = 1.0 - bottom + ((io_UV.y - bB) / (1.0 - bB)) * bottom;
        float yC = top + ((io_UV.y - tB) / (bB - tB)) * (1.0 - top - bottom);

        localUV.y = regionT * yT + regionC * yC + regionB * yB;
    }

    return localUV;
}

void main() {
    vec4 diffuseColor = texture(map, calculateNineSliceUV()) * color;
    #include <alphatest_fragment>
    #include <alphahash_fragment>
    gl_FragColor = diffuseColor;
    #include <colorspace_fragment>
}
