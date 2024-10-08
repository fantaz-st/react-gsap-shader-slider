import React, { useEffect, useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { TextureLoader, Vector4 } from "three";
import gsap from "gsap";
import slides from "./data";
import { fragmentShader, vertexShader } from "./shaders/shaders";
import classes from "./Slider.module.css";

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

const FullScreenSlider = () => {
  const texturesRef = useRef([]); // Textures managed as a ref
  const displacementRef = useRef(); // Displacement map ref
  const dispFactorRef = useRef(0); // Displacement factor managed as a ref
  const currentIndexRef = useRef(0); // Track current index using a ref
  const directionRef = useRef(1); // Direction of animation (1 for forward, -1 for backward)
  const isTransitioningRef = useRef(false); // Track if a transition is in progress
  const scrollTimeout = useRef(null); // Ref to handle debounce
  const titleRef = useRef(); // Ref for the current title h1 element
  const newTitleRef = useRef(); // Ref for the new title h1 element

  // Load textures and displacement map asynchronously
  useEffect(() => {
    const loadTexture = (src) => new Promise((resolve) => new TextureLoader().load(src, resolve));
    Promise.all([loadTexture(slides[0].img), loadTexture(slides[1].img), loadTexture("/displacement.jpg")]).then(([texture1, texture2, disp]) => {
      texturesRef.current = [texture1, texture2];
      displacementRef.current = disp;
    });
  }, []);

  // Set up scroll event listener
  useEffect(() => {
    const handleWheel = (event) => {
      if (isTransitioningRef.current) return;

      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        changeSlide(event.deltaY > 0 ? 1 : -1);
      }, 300);
    };

    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout.current);
    };
  }, []);

  // Change slide and handle title animations
  const changeSlide = (direction) => {
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    directionRef.current = direction;
    const targetIndex = (currentIndexRef.current + direction + slides.length) % slides.length;

    // Set the new title's content before animating
    newTitleRef.current.innerText = slides[targetIndex].title;

    // Load the next texture and update textures
    const loadTexture = (src) => new Promise((resolve) => new TextureLoader().load(src, resolve));
    loadTexture(slides[targetIndex].img).then((targetTexture) => {
      texturesRef.current[1] = targetTexture;

      // Set initial positions and styles for the new title
      gsap.set(newTitleRef.current, { y: direction === 1 ? 200 : -200, opacity: 0, visibility: "visible" });

      // Create the animation timeline
      const tl = gsap.timeline({
        onComplete: () => {
          // After animation completes, update the current title and reset states
          titleRef.current.innerText = slides[targetIndex].title;
          newTitleRef.current.innerText = "";
          gsap.set(newTitleRef.current, { visibility: "hidden" }); // Hide new title after transition
          texturesRef.current = [targetTexture, targetTexture];
          currentIndexRef.current = targetIndex;
          dispFactorRef.current = 0.0;
          isTransitioningRef.current = false;
        },
      });

      // Animate current title out
      tl.to(titleRef.current, {
        y: direction === 1 ? -200 : 200,
        duration: 0.7,
        ease: "power2.out",
      });

      // Animate new title in simultaneously
      tl.fromTo(newTitleRef.current, { y: direction === 1 ? 200 : -200 }, { y: 0, duration: 0.7, ease: "power2.in" }, 0);

      // Animate displacement effect
      tl.to(
        dispFactorRef,
        {
          current: 1.0,
          duration: 0.7,
          ease: "Sine.easeInOut",
          onUpdate: () => {
            dispFactorRef.current = gsap.getProperty(dispFactorRef, "current");
          },
        },
        0
      );
    });
  };

  return (
    <div className={classes.container}>
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
        <ShaderPlane texturesRef={texturesRef} displacementRef={displacementRef} dispFactorRef={dispFactorRef} directionRef={directionRef} />
      </Canvas>
      <div className={classes.titleContainer}>
        {/* Current Title */}
        <h1 ref={titleRef} className={classes.title}>
          {slides[0].title}
        </h1>
        {/* New Title */}
        <h1 ref={newTitleRef} className={`${classes.title}`}>
          {/* New title will be set dynamically */}
        </h1>
      </div>
    </div>
  );
};

export default FullScreenSlider;
