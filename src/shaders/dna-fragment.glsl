varying float vDelay;

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

void main() {
    // Convert point coordinates to centered space (-0.5 to 0.5)
    vec2 p = gl_PointCoord - 0.5;

    float radius = length(p);

    // Randomize opacity value between 0.5 and 1.0 using unique particle delay
    float opacity = mix(0.5, 1.0, random(vec2(vDelay, vDelay * 2.0)));
    // Step to make the particles look like circles
    float circle = (1.0 - step(0.5, radius));

    // Combine both layers for soft, glowing particles
    vec3 vColor = vec3(1.0, 1.0, 1.0);
    gl_FragColor = vec4(vColor, circle * opacity);
}
