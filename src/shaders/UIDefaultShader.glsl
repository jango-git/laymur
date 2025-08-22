void main() {
    vec4 diffuseColor = texture(map, io_UV) * color;
    #include <alphatest_fragment>
    #include <alphahash_fragment>
    gl_FragColor = diffuseColor;
    #include <colorspace_fragment>
}
