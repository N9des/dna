attribute float radian;
attribute float radius;
attribute float delay;
attribute vec3 randomPos;

uniform float time;
uniform float entryProgress;
uniform float entryStagger;
uniform float rotationSpeed;
uniform float wiggleSpeed;
uniform float scaleBase;
uniform float scaleAmplitude;
uniform float scaleSpeed;
uniform vec3 rayOrigin;
uniform vec3 rayDir;
uniform vec3 mouseVelocity;
uniform float mouseRadius;
uniform float mouseStrength;
uniform float trailStrength;

varying float vDelay;
varying float vEntryOpacity;

void main() {
    float wiggle = sin(time * wiggleSpeed + delay);
    float animRadian = radian + time * rotationSpeed;
    float animRadius = radius + wiggle;

    vec3 dnaPos = position + vec3(
        wiggle,
        sin(animRadian) * animRadius,
        cos(animRadian) * animRadius
    );

    // Entry animation: spread -> DNA with per-particle stagger
    float stagger = delay / 6.28318; // normalize delay (0-1)
    float progressScale = 1.0 / (1.0 - entryStagger + 0.001);
    float particleProgress = clamp((entryProgress - stagger * entryStagger) * progressScale, 0.0, 1.0);
    // Smooth easing
    particleProgress = particleProgress * particleProgress * (3.0 - 2.0 * particleProgress);

    vec3 pos = mix(randomPos, dnaPos, particleProgress);
    vEntryOpacity = particleProgress;

    // Mouse repel effect (ray-based for full depth)
    vec3 toPos = pos - rayOrigin;
    float t = dot(toPos, rayDir);
    vec3 closestPoint = rayOrigin + rayDir * t;
    vec3 toRay = pos - closestPoint;
    float dist = length(toRay);

    // Softer, more organic falloff curve
    float influence = smoothstep(mouseRadius, 0.0, dist);
    influence = influence * influence * (3.0 - 2.0 * influence); // smoother easing

    // Per-particle variation using delay for organic feel
    float particleNoise = sin(delay * 10.0 + time * 2.0) * 0.3 + 0.7;

    // Radial repel + trailing in mouse movement direction
    vec3 repelDir = dist > 0.001 ? normalize(toRay) : vec3(0.0);

    // Add slight rotation to repel direction for swirl effect
    float angle = delay + time * 0.5;
    vec3 tangent = normalize(cross(repelDir, rayDir));
    repelDir = repelDir * 0.8 + tangent * sin(angle) * 0.2;

    vec3 trailDir = mouseVelocity * trailStrength;
    vec3 repelOffset = (repelDir * mouseStrength * particleNoise + trailDir) * influence;
    pos += repelOffset;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    vDelay = delay;
    gl_Position = projectionMatrix * mvPos;

    float scaleAnim = scaleBase + scaleAmplitude * sin(time * scaleSpeed + delay);
    gl_PointSize = 1000.0 / length(mvPos.xyz) * scaleAnim;
}
