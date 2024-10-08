import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { verticalLoop } from "./helper";
import classes from "./Slider.module.css";
import slides from "./data";

gsap.registerPlugin(useGSAP);

const Slider = () => {
  const containerRef = useRef(null);
  const titleLoopRef = useRef(null);
  const subtitleLoopRef = useRef(null);
  const currentIndexRef = useRef(0);
  const scrollTimeout = useRef(0);
  const isTransitioningRef = useRef(false);

  useGSAP(
    () => {
      const titleItems = gsap.utils.toArray(`.${classes.title}`);
      const subtitleItems = gsap.utils.toArray(`.${classes.subTitle}`);

      titleLoopRef.current = verticalLoop(titleItems, { speed: 0.7, repeat: -1, paused: true });
      subtitleLoopRef.current = verticalLoop(subtitleItems, { speed: 0.7, repeat: -1, paused: true, paddingBottom: 15 });

      const changeSlide = (direction) => {
        if (direction === 1) {
          titleLoopRef.current.next({ duration: 0.7, ease: "power2.out" });
          subtitleLoopRef.current.next({ duration: 0.7, ease: "power2.out" });
        } else {
          titleLoopRef.current.previous({ duration: 0.7, ease: "power2.out" });
          subtitleLoopRef.current.previous({ duration: 0.7, ease: "power2.out" });
        }

        //implement navigation?

        /* const newIndex = currentIndexRef.current + direction;

        currentIndexRef.current = newIndex;
        titleLoopRef.current.toIndex(newIndex, { duration: 1, ease: "power2.out" });
        subtitleLoopRef.current.toIndex(newIndex, { duration: 1, ease: "power2.out" }); */
      };

      // samo kontrole naprid nazad
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
    </div>
  );
};

export default Slider;
