out vec2 light_worldPos;

void light_vertex(inout vec4 p, vec2 u) {
    light_worldPos = p.xy;
}
