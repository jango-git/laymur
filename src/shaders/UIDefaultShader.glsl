void main() {
    vec2 transformedUV = (uvTransform * vec3(io_UV, 1.0)).xy;
    vec4 diffuseColor = texture(map, transformedUV) * color;
    #include <alphatest_fragment>
    #include <alphahash_fragment>
    gl_FragColor = diffuseColor;
    #include <colorspace_fragment>
}
