// GLSL sources for the WebGL backgrounds rendered by ShaderBackground.vue.
// WebGL1 / GLSL ES 1.00 so it runs on every GPU the site targets.

export const fullscreenVertex = /* glsl */ `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Domain-warped fbm smoke in the site's amber accent (flax-smoke-500/600),
// pulled toward the pointer. Kept deliberately dim so hero copy stays the
// focus: the brightest output is well under the white text it sits behind.
export const emberFragment = /* glsl */ `
precision mediump float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform vec2 u_mouse;      // 0..1, y up
uniform float u_time;
uniform float u_intensity; // 0..1, eased in by the host component

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.02 + 17.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = v_uv;
  vec2 p = vec2(uv.x * aspect, uv.y) * 1.6;
  vec2 mouse = vec2(u_mouse.x * aspect, u_mouse.y) * 1.6;
  float t = u_time * 0.045;

  // Two-pass domain warp; the pointer bends the field around itself.
  float toMouse = length(p - mouse);
  vec2 pull = (mouse - p) * 0.35 * exp(-toMouse * 1.4);
  vec2 q = vec2(fbm(p + pull + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p + 3.5 * q + vec2(1.7, 9.2) + 0.6 * t),
    fbm(p + 3.5 * q + vec2(8.3, 2.8) - 0.4 * t)
  );
  float f = fbm(p + 3.0 * r);

  vec3 deep = vec3(0.851, 0.467, 0.024);  // #d97706
  vec3 amber = vec3(0.961, 0.620, 0.043); // #f59e0b
  vec3 color = mix(deep, amber, clamp(length(q) * 0.9, 0.0, 1.0));

  // Shape: smoke rises from the lower right, fades into the black top-left
  // where the headline sits, plus a soft halo that follows the pointer.
  float body = smoothstep(0.35, 1.05, f * 1.25) * smoothstep(-0.1, 0.9, uv.x * 0.6 + (1.0 - uv.y) * 0.7);
  float halo = exp(-toMouse * 2.6) * 0.35;
  float glow = (body * 0.45 + halo * f) * u_intensity;

  // Vignette + ordered grain to avoid 8-bit banding in the dark gradient.
  float vignette = smoothstep(1.25, 0.2, length((uv - 0.5) * vec2(aspect * 0.8, 1.0)));
  float grain = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0 * 3.0;

  vec3 outColor = color * glow * vignette + grain;
  gl_FragColor = vec4(outColor, 1.0);
}
`;
