// Custom GLSL Shaders for VOID Music's Upward-Flowing Liquid-Metal Environment
// Ultra-optimized for Apple Silicon (A18 Pro) & Safari Metal pipeline:
// - Single-pass vertex domain warp & orbital trigonometry
// - Zero transcendental pow() calls in the fragment shader (replaced with FMA multiplication chains)

const SHARED_GLSL_UTILS = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  vec3 computeLiquidMetalShading(
    vec3 normal,
    vec3 viewDir,
    vec3 worldPos,
    float foldCrest,
    float uTime,
    float uWarmth,
    vec2 uPointer
  ) {
    vec3 N = normalize(normal);
    vec3 V = normalize(viewDir);
    vec3 R = reflect(-V, N);

    float NdotV = max(dot(N, V), 0.0);
    float oneMinusNdotV = 1.0 - NdotV;
    float om2 = oneMinusNdotV * oneMinusNdotV;
    float fresnel = om2 * oneMinusNdotV;
    float grazing = om2 * om2 * oneMinusNdotV;

    vec3 lightDir1 = normalize(vec3(0.65 + uPointer.x * 0.15, 0.72 + uPointer.y * 0.12, 0.68));
    vec3 halfVec1 = normalize(lightDir1 + V);
    float NdotL1 = max(dot(N, lightDir1), 0.0);
    float h1 = max(dot(N, halfVec1), 0.0);

    vec3 lightDir2 = normalize(vec3(-0.55, -0.18, 0.78));
    vec3 halfVec2 = normalize(lightDir2 + V);
    float h2 = max(dot(N, halfVec2), 0.0);

    vec3 lightDir3 = normalize(vec3(0.12, 0.92, 0.38));
    vec3 halfVec3 = normalize(lightDir3 + V);
    float h3 = max(dot(N, halfVec3), 0.0);

    // Fast hardware multiplication chains instead of transcendental pow()
    float h1_2 = h1 * h1;
    float h1_4 = h1_2 * h1_2;
    float h1_8 = h1_4 * h1_4;
    float h1_14 = h1_8 * h1_4 * h1_2;
    float h1_16 = h1_8 * h1_8;
    float h1_32 = h1_16 * h1_16;
    float h1_96 = h1_32 * h1_32 * h1_32;

    float h2_2 = h2 * h2;
    float h2_4 = h2_2 * h2_2;
    float h2_8 = h2_4 * h2_4;
    float h2_16 = h2_8 * h2_8;
    float h2_18 = h2_16 * h2_2;
    float h2_64 = h2_16 * h2_16 * h2_16 * h2_16;
    float h2_72 = h2_64 * h2_8;

    float h3_2 = h3 * h3;
    float h3_4 = h3_2 * h3_2;
    float h3_10 = h3_4 * h3_4 * h3_2;

    float specSatin1 = h1_14 * 0.58;
    float specSharp1 = h1_96 * 1.15;

    float specSatin2 = h2_18 * 0.46;
    float specSharp2 = h2_72 * 0.85;

    float specSatin3 = h3_10 * 0.35;

    float studioBandA = smoothstep(-0.25, 0.65, R.y + R.x * 0.45 + sin(R.z * 2.0 + uTime * 0.25) * 0.12);
    float studioBandB = smoothstep(0.15, 0.88, R.x * 0.6 - R.y * 0.3 + cos(worldPos.x * 0.4) * 0.15);
    float horizonTerm = (R.y - 0.18 + N.x * 0.25) * 3.4;
    float horizonRibbon = exp(-horizonTerm * horizonTerm);

    vec3 deepObsidian = vec3(0.028, 0.029, 0.036);
    vec3 charcoalMid  = vec3(0.135, 0.142, 0.162);
    vec3 coolSilver   = vec3(0.76, 0.80, 0.87);
    vec3 warmChampagne = mix(vec3(0.82, 0.78, 0.74), vec3(0.96, 0.86, 0.74), uWarmth);
    vec3 pureHighlight = vec3(1.0, 0.98, 0.95);

    vec3 envColor = mix(deepObsidian, charcoalMid, studioBandA * 0.75 + NdotL1 * 0.35);
    envColor = mix(envColor, coolSilver * 0.48, horizonRibbon * 0.55 + specSatin3);
    envColor = mix(envColor, warmChampagne * 0.62, studioBandB * fresnel * 0.75);

    float crestFactor = smoothstep(-0.3, 0.8, foldCrest);
    envColor += warmChampagne * (specSatin1 * (0.65 + 0.35 * crestFactor));
    envColor += mix(coolSilver, warmChampagne, 0.65) * (specSatin2 * 0.85);
    envColor += pureHighlight * (specSharp1 + specSharp2 * 0.75);
    envColor += mix(coolSilver, warmChampagne, 0.55) * grazing * 0.52;

    return envColor;
  }
`;

export const LIQUID_RIBBON_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uAudioIntensity;
  uniform vec2 uPointer;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoldCrest;
  varying vec2 vUv;

  ${SHARED_GLSL_UTILS}

  vec3 displaceRibbonFast(vec3 pos, float sharedWarp, float orbitalTerm, float orbitalInfluence) {
    float upwardFlow = pos.y * 0.72 - uTime * 0.42 - uScroll * 1.35;

    float primaryFoldPhase = pos.x * 0.68 - pos.y * 1.35 + uTime * 0.48 + uScroll * 1.4 + sharedWarp * 1.15;
    float primaryFold = sin(primaryFoldPhase) * 0.58;

    float secondaryFoldPhase = pos.y * 1.65 - uTime * 0.62 - pos.x * 0.42 + sharedWarp * 0.85 + orbitalTerm;
    float secondaryFold = cos(secondaryFoldPhase) * 0.34;

    float lx = (pos.x + 1.45) * 0.55;
    float ly = (pos.y + 0.85) * 0.8;
    float leftSwirl = exp(-lx * lx - ly * ly) * 0.65;

    float rx = (pos.x - 2.35) * 0.75;
    float ry = (pos.y + 0.35) * 0.9;
    float rightLip = exp(-rx * rx - ry * ry) * 0.72;

    float upwardWave = sin(upwardFlow * 2.1 + pos.x * 0.55) * 0.22 * (0.85 + uAudioIntensity * 0.25);

    float zOffset = primaryFold + secondaryFold + leftSwirl + rightLip + upwardWave;
    float yOffset = cos(primaryFoldPhase * 0.8) * 0.18 + sin(upwardFlow * 1.6) * 0.14;
    float xOffset = sin(secondaryFoldPhase * 0.7) * 0.12 * orbitalInfluence;

    return vec3(pos.x + xOffset, pos.y + yOffset, pos.z + zOffset);
  }

  void main() {
    vUv = uv;

    float upwardFlowBase = position.y * 0.72 - uTime * 0.42 - uScroll * 1.35;
    float sharedWarp = snoise(vec3(position.x * 0.24 + uPointer.x * 0.08, upwardFlowBase * 0.55, uTime * 0.14));

    vec2 toCluster = position.xy - vec2(1.05, 0.15);
    float distCluster = length(toCluster);
    float orbitalAngle = atan(toCluster.y, toCluster.x) + uTime * 0.22;
    float orbitalInfluence = exp(-distCluster * 0.38);
    float orbitalTerm = sin(orbitalAngle) * orbitalInfluence * 0.9;

    float eps = 0.06;
    vec3 displaced = displaceRibbonFast(position, sharedWarp, orbitalTerm, orbitalInfluence);
    vec3 displacedX = displaceRibbonFast(position + vec3(eps, 0.0, 0.0), sharedWarp, orbitalTerm, orbitalInfluence);
    vec3 displacedY = displaceRibbonFast(position + vec3(0.0, eps, 0.0), sharedWarp, orbitalTerm, orbitalInfluence);

    vec3 tangentX = normalize(displacedX - displaced);
    vec3 tangentY = normalize(displacedY - displaced);
    vec3 computedNormal = normalize(cross(tangentX, tangentY));

    vFoldCrest = displaced.z;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal = normalize(mat3(modelMatrix) * computedNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const LIQUID_RIBBON_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uWarmth;
  uniform vec2 uPointer;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoldCrest;
  varying vec2 vUv;

  ${SHARED_GLSL_UTILS}

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 color = computeLiquidMetalShading(
      vNormal,
      viewDir,
      vWorldPos,
      vFoldCrest,
      uTime,
      uWarmth,
      uPointer
    );

    float lx = (vWorldPos.x + 1.55) * 0.65;
    float ly = (vWorldPos.y + 1.35) * 0.85;
    float leftGlow = exp(-lx * lx - ly * ly);

    float rx = (vWorldPos.x - 2.65) * 0.85;
    float ry = (vWorldPos.y + 0.72) * 1.1;
    float rightRimGlow = exp(-rx * rx - ry * ry);

    color += vec3(0.95, 0.86, 0.74) * leftGlow * 0.34;
    color += vec3(0.98, 0.95, 0.90) * rightRimGlow * 0.42;

    float topFade = smoothstep(0.98, 0.68, vUv.y);
    float bottomFade = smoothstep(0.0, 0.16, vUv.y);
    float rightFade = smoothstep(1.0, 0.86, vUv.x);
    float alpha = topFade * bottomFade * rightFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const LIQUID_ORB_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uAudioIntensity;
  uniform vec2 uPointer;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoldCrest;

  ${SHARED_GLSL_UTILS}

  vec3 displaceOrbFast(vec3 pos, float lowFreqNoise, float angleMod) {
    vec3 dir = normalize(pos);
    float radius = length(pos);

    float upwardCoord = dir.y * 2.2 - uTime * 0.46 - uScroll * 1.25;
    float radialRim = sqrt(max(0.0, dir.x * dir.x + dir.y * dir.y));
    float outerCrest = sin(radialRim * 7.2 - uTime * 0.55 + angleMod) * 0.085 * smoothstep(0.42, 0.98, radialRim);

    float upwardUndulation = sin(upwardCoord * 1.8 + dir.x * 1.4 + lowFreqNoise * 1.2) * 0.065 * (0.85 + uAudioIntensity * 0.25);

    float totalDisp = outerCrest + upwardUndulation + lowFreqNoise * 0.045;
    return pos + dir * totalDisp * radius;
  }

  void main() {
    vec3 dir0 = normalize(position);
    float upwardCoord0 = dir0.y * 2.2 - uTime * 0.46 - uScroll * 1.25;
    float sharedNoise = snoise(vec3(dir0.x * 1.15, upwardCoord0 * 0.65, dir0.z * 1.15 + uTime * 0.18));
    float angle0 = atan(dir0.y, dir0.x) - uTime * 0.24;
    float angleMod = sin(angle0 * 2.0) * 0.45;

    float eps = 0.025;
    vec3 p0 = displaceOrbFast(position, sharedNoise, angleMod);

    vec3 upVec = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(upVec, normal));
    vec3 bitangent = normalize(cross(normal, tangent));

    vec3 pT = displaceOrbFast(position + tangent * eps, sharedNoise, angleMod);
    vec3 pB = displaceOrbFast(position + bitangent * eps, sharedNoise, angleMod);

    vec3 displacedNormal = normalize(cross(normalize(pT - p0), normalize(pB - p0)));

    vFoldCrest = (length(p0) - length(position)) * 8.0;
    vec4 worldPosition = modelMatrix * vec4(p0, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal = normalize(mat3(modelMatrix) * displacedNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const LIQUID_ORB_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uWarmth;
  uniform vec2 uPointer;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoldCrest;

  ${SHARED_GLSL_UTILS}

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 color = computeLiquidMetalShading(
      vNormal,
      viewDir,
      vWorldPos,
      vFoldCrest,
      uTime,
      uWarmth,
      uPointer
    );

    float playerCenterDist = length(vWorldPos.xy - vec2(1.05, 0.15));
    float centerShadow = smoothstep(0.25, 1.45, playerCenterDist);
    color *= mix(0.58, 1.08, centerShadow);

    float topRightArc = smoothstep(0.1, 0.9, vNormal.x * 0.65 + vNormal.y * 0.75);
    float oneMinusNdotV = 1.0 - max(dot(normalize(vNormal), viewDir), 0.0);
    float rimFactor = oneMinusNdotV * oneMinusNdotV;
    color += vec3(0.98, 0.88, 0.76) * topRightArc * rimFactor * 0.58;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const LIQUID_DROPLET_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uElongation;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFoldCrest;

  vec3 displaceDroplet(vec3 pos) {
    vec3 p = pos;
    float px = p.x * 2.2;
    float pinch = 1.0 - uElongation * 0.28 * exp(-px * px);
    p.y *= pinch;
    p.z *= pinch;
    p.x *= (1.0 + uElongation * 0.45);

    float wave = sin(p.y * 2.8 - uTime * 1.45 + uPhase) * 0.06 +
                 cos(p.x * 2.4 + uTime * 1.1 + uPhase) * 0.05;
    vec3 dir = normalize(pos);
    return p + dir * wave;
  }

  void main() {
    float eps = 0.025;
    vec3 p0 = displaceDroplet(position);
    vec3 upVec = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(upVec, normal));
    vec3 bitangent = normalize(cross(normal, tangent));

    vec3 pT = displaceDroplet(position + tangent * eps);
    vec3 pB = displaceDroplet(position + bitangent * eps);
    vec3 displacedNormal = normalize(cross(normalize(pT - p0), normalize(pB - p0)));

    vFoldCrest = 0.35;
    vec4 worldPosition = modelMatrix * vec4(p0, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal = normalize(mat3(modelMatrix) * displacedNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
