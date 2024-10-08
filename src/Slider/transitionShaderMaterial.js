import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import React, { useRef } from "react";
import vertexShader from "./vertexShader.glsl";
import fragmentShader from "./fragmentShader.glsl";

// Define the custom shader material
const TransitionShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgress: 0,
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
  },
  vertexShader,
  fragmentShader
);

// Extend so it can be used as a JSX element in the scene
extend({ TransitionShaderMaterial });
