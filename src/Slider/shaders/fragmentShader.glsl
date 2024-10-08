uniform float uTime;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Basic mix transition based on uProgress
  vec4 tex1 = texture2D(uTexture1, uv);
  vec4 tex2 = texture2D(uTexture2, uv);
  vec4 color = mix(tex1, tex2, uProgress);

  gl_FragColor = color;
}
