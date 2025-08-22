void main() {
    vec4 foregroundDiffuseColor = texture(foregroundTexture, io_UV) * foregroundColor * color;
    vec4 backgroundDiffuseColor = texture(backgroundTexture, io_UV) * backgroundColor * color;

    float mask = calculateMask();
    vec4 diffuseColor = foregroundDiffuseColor * mask
            + backgroundDiffuseColor * (1.0 - foregroundDiffuseColor.a * mask);

    #include <alphatest_fragment>
    #include <alphahash_fragment>
    gl_FragColor = diffuseColor;
    #include <colorspace_fragment>
}
