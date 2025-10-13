attribute float radian;
attribute float radius;
attribute float delay;

uniform float time;

varying float vDelay;

void main() {
    float wiggle = sin(time * 4.0 + delay);
    float animRadian = radian + time * 0.4;
    float animRadius = radius + wiggle;

    vec3 pos = position + vec3(
        wiggle,
        sin(animRadian) * animRadius,
        cos(animRadian) * animRadius
    );

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    vDelay = delay;
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = 1000.0 / length(mvPos.xyz) * 1.6;
}
