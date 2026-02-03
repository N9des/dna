attribute float radian;
attribute float radius;
attribute float delay;

uniform float time;
uniform float rotationSpeed;
uniform float wiggleSpeed;
uniform float scaleBase;
uniform float scaleAmplitude;
uniform float scaleSpeed;

varying float vDelay;

void main() {
    float wiggle = sin(time * wiggleSpeed + delay);
    float animRadian = radian + time * rotationSpeed;
    float animRadius = radius + wiggle;

    vec3 pos = position + vec3(
        wiggle,
        sin(animRadian) * animRadius,
        cos(animRadian) * animRadius
    );

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    vDelay = delay;
    gl_Position = projectionMatrix * mvPos;

    float scaleAnim = scaleBase + scaleAmplitude * sin(time * scaleSpeed + delay);
    gl_PointSize = 1000.0 / length(mvPos.xyz) * scaleAnim;
}
