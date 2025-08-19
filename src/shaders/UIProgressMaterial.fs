uniform sampler2D background;
uniform sampler2D foreground;
uniform float progress;
uniform vec3 color;
uniform vec3 backgroundColor;
uniform vec3 foregroundColor;
uniform float opacity;
uniform float backgroundOpacity;
uniform float foregroundOpacity;
uniform float alphaTest;
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
    float progressMask = step(threshold, progress);

    vec4 mixedColor = foregroundColor * progressMask
            + backgroundColor * (1.0 - foregroundColor.a * progressMask);

    if (mixedColor.a < alphaTest) {
        discard;
    }

    gl_FragColor = mixedColor;
    #include <colorspace_fragment>
}
