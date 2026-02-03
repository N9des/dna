varying float vDelay;
varying float vEntryOpacity;

uniform vec3 particleColor;

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

void main() {
    // Convert point coordinates to centered space (-0.5 to 0.5)
    vec2 p = gl_PointCoord - 0.5;

    float radius = length(p);

    // Randomize opacity value between 0.5 and 1.0 using unique particle delay
    float opacity = mix(0.5, 1.0, random(vec2(vDelay, vDelay * 2.0)));

    // Soft circle with tighter edge
    float softCircle = 1.0 - smoothstep(0.1, 0.5, radius);

    // Combine both layers for soft, glowing particles
    vec3 vColor = particleColor / 255.0;
    gl_FragColor = vec4(vColor, softCircle * opacity * vEntryOpacity);
}
