out vec2 io_UV;
#include <common>

void main() {
    #include <begin_vertex>
    io_UV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
