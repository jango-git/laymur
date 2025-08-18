uniform sampler2D map;
uniform float opacity;
uniform vec3 color;
uniform float alphaTest;
varying vec2 vUv;

void main() {
    vec4 diffuseColor = texture2D(map, vUv);
    #include <alphatest_fragment>
    gl_FragColor = vec4(diffuseColor.rgb * color, diffuseColor.a * opacity);
    #include <colorspace_fragment>
}
