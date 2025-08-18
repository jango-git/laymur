uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
uniform float alphaTest;
uniform vec4 sliceBorders;
uniform vec2 quadSize;
uniform vec2 textureSize;
varying vec2 vUv;

vec2 calculateNineSliceUV(vec2 uv) {
    vec2 localUV = uv;

    float left = sliceBorders.x;
    float right = sliceBorders.y;
    float top = sliceBorders.z;
    float bottom = sliceBorders.w;

    float leftPx = left * textureSize.x;
    float rightPx = right * textureSize.x;
    float topPx = top * textureSize.y;
    float bottomPx = bottom * textureSize.y;

    float lB = leftPx / quadSize.x;
    float rB = 1.0 - (rightPx / quadSize.x);
    float tB = topPx / quadSize.y;
    float bB = 1.0 - (bottomPx / quadSize.y);

    {
        float regionL = step(uv.x, lB);
        float regionR = step(rB, uv.x);
        float regionM = 1.0 - regionL - regionR;

        float xL = uv.x * (left / lB);
        float xR = 1.0 - right + ((uv.x - rB) / (1.0 - rB)) * right;
        float xM = left + ((uv.x - lB) / (rB - lB)) * (1.0 - left - right);

        localUV.x = regionL * xL + regionM * xM + regionR * xR;
    }

    {
        float regionT = step(uv.y, tB);
        float regionB = step(bB, uv.y);
        float regionC = 1.0 - regionT - regionB;

        float yT = uv.y * (top / tB);
        float yB = 1.0 - bottom + ((uv.y - bB) / (1.0 - bB)) * bottom;
        float yC = top + ((uv.y - tB) / (bB - tB)) * (1.0 - top - bottom);

        localUV.y = regionT * yT + regionC * yC + regionB * yB;
    }

    return localUV;
}

void main() {
    vec4 textureColor = texture2D(map, calculateNineSliceUV(vUv));
    if (textureColor.a < alphaTest) {
        discard;
    }
    gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * opacity);
    #include <colorspace_fragment>
}
