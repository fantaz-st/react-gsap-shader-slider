import React, { useRef, useEffect } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { TextureLoader, Vector4 } from "three";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { verticalLoop } from "./helper";
import classes from "./Slider.module.css";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders/shaders";

// Register GSAP plugins
gsap.registerPlugin(useGSAP);

// Define the custom shader material
const TransitionShaderMaterial = shaderMaterial(
  {
    dispFactor: 0.0,
    effectFactor: 0.5,
    direction: 1.0,
    currentImage: new THREE.Texture(),
    nextImage: new THREE.Texture(),
    disp: new THREE.Texture(),
    resolution: new Vector4(1, 1, 1, 1),
  },
  vertexShader,
  fragmentShader
);
extend({ TransitionShaderMaterial });

// ShaderPlane Component
const ShaderPlane = ({ texturesRef, displacementRef, dispFactorRef, directionRef }) => {
  const materialRef = useRef();
  const { viewport, size } = useThree();

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.resolution = new Vector4(size.width, size.height, 1.0, 1.0);
      materialRef.current.dispFactor = dispFactorRef.current;
      materialRef.current.direction = directionRef.current;
      materialRef.current.currentImage = texturesRef.current[0];
      materialRef.current.nextImage = texturesRef.current[1];
      materialRef.current.disp = displacementRef.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <transitionShaderMaterial ref={materialRef} />
    </mesh>
  );
};

// Main Slider Component
const Slider = () => {
  const containerRef = useRef(null);
  const titleLoopRef = useRef(null);
  const subtitleLoopRef = useRef(null);
  const scrollTimeout = useRef(0);
  const isTransitioningRef = useRef(false);

  const texturesRef = useRef([]); // Textures managed as a ref
  const displacementRef = useRef(); // Displacement map ref
  const dispFactorRef = useRef(0); // Displacement factor managed as a ref
  const currentIndexRef = useRef(0); // Track current index using a ref
  const directionRef = useRef(1); // Direction of animation (1 for forward, -1 for backward)

  // Utility function to load textures
  const loadTexture = (src) => {
    return new Promise((resolve) => {
      new TextureLoader().load(src, resolve);
    });
  };

  // Load initial textures and displacement map
  useEffect(() => {
    Promise.all([loadTexture(slides[0].img), loadTexture(slides[1].img), loadTexture("/displacement.jpg")]).then(([texture1, texture2, disp]) => {
      texturesRef.current = [texture1, texture2];
      displacementRef.current = disp;
    });
  }, []);

  // GSAP and Scroll Animation Setup
  useGSAP(
    () => {
      const titleItems = gsap.utils.toArray(`.${classes.title}`);
      const subtitleItems = gsap.utils.toArray(`.${classes.subTitle}`);

      titleLoopRef.current = verticalLoop(titleItems, { speed: 0.7, repeat: -1, paused: true });
      subtitleLoopRef.current = verticalLoop(subtitleItems, { speed: 0.7, repeat: -1, paused: true, paddingBottom: 15 });

      const changeSlide = (direction) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        directionRef.current = direction; // Set the animation direction
        const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;

        // Text Animation
        if (direction === 1) {
          titleLoopRef.current.next({ duration: 0.7, ease: "Sine.easeInOut" });
          subtitleLoopRef.current.next({ duration: 0.7, ease: "Sine.easeInOut" });
        } else {
          titleLoopRef.current.previous({ duration: 0.7, ease: "Sine.easeInOut" });
          subtitleLoopRef.current.previous({ duration: 0.7, ease: "Sine.easeInOut" });
        }

        // Image Transition Animation
        loadTexture(slides[targetIndex].img).then((targetTexture) => {
          texturesRef.current[1] = targetTexture;

          gsap.to(dispFactorRef, {
            current: 1.0,
            duration: 0.7,
            ease: "Sine.easeInOut",
            onUpdate: () => {
              dispFactorRef.current = gsap.getProperty(dispFactorRef, "current");
            },
            onComplete: () => {
              texturesRef.current = [targetTexture, targetTexture];
              currentIndexRef.current = targetIndex;
              dispFactorRef.current = 0.0;
              isTransitioningRef.current = false;
            },
          });
        });
      };

      const handleWheel = (event) => {
        if (isTransitioningRef.current) return;

        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          changeSlide(event.deltaY > 0 ? 1 : -1);
        }, 300);
      };

      containerRef.current.addEventListener("wheel", handleWheel);

      return () => {
        containerRef.current.removeEventListener("wheel", handleWheel);
      };
    },
    { scope: containerRef }
  );

  return (
    <div className={classes.container} ref={containerRef}>
      {/* Canvas for Shader Plane */}

      {/* Title and Subtitle Container */}
      <div className={classes.slideContent}>
        <div className={classes.textContainer}>
          {slides.map((slide, index) => (
            <div key={index} className={classes.title}>
              <span>0{index + 1}</span>
              <h1>{slide.title}</h1>
            </div>
          ))}
        </div>
        <div className={classes.separator} />

        <div className={classes.otherTexts}>
          <div className={classes.inner}>
            {slides.map((slide, index) => (
              <p key={index + "subtitle"} className={classes.subTitle}>
                <span>{slide.title}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
        <ShaderPlane texturesRef={texturesRef} displacementRef={displacementRef} dispFactorRef={dispFactorRef} directionRef={directionRef} />
      </Canvas>
    </div>
  );
};

export default Slider;
