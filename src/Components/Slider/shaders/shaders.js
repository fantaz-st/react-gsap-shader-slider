export const fragmentShader = `
varying vec2 vUv;
    uniform sampler2D currentImage;
    uniform sampler2D nextImage;
    uniform sampler2D disp;
    uniform float dispFactor;
    uniform float effectFactor;
    uniform float direction; // Uniform for direction control
    uniform vec4 resolution;

    void main() {
      vec2 uv = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

      vec4 disp = texture2D(disp, uv);
      // Use direction to control the displacement direction
      vec2 distortedPosition = vec2(uv.x, uv.y - dispFactor * (disp.r * effectFactor) * direction);
      vec2 distortedPosition2 = vec2(uv.x, uv.y + (1.0 - dispFactor) * (disp.r * effectFactor) * direction);

      vec4 _currentImage = texture2D(currentImage, distortedPosition);
      vec4 _nextImage = texture2D(nextImage, distortedPosition2);
      vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);

      gl_FragColor = finalTexture;
    }`;

export const vertexShader = `
  varying vec2 vUv; void main() {  vUv = uv;  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );	}
`;
