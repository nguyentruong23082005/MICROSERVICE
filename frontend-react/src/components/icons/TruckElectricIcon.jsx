/*
 * Copyright (c) 2026 Its Hover Icons
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { forwardRef, useImperativeHandle, useCallback } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";

const TruckElectricIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (shouldReduceMotion) return;
      await animate(
        ".truck",
        {
          x: [0, 30],
          opacity: [1, 0],
        },
        {
          duration: 0.5,
          ease: "easeIn",
        },
      );

      animate(
        ".truck",
        {
          x: -30,
        },
        {
          duration: 0,
        },
      );

      await animate(
        ".truck",
        {
          x: [-30, 0],
          opacity: [0, 1],
        },
        {
          duration: 0.5,
          ease: "easeOut",
          delay: 0.1,
        },
      );
    }, [animate, shouldReduceMotion]);

    const stop = useCallback(() => {
      if (shouldReduceMotion) return;
      animate(
        ".truck",
        { x: 0, opacity: 1 },
        { duration: 0.2, ease: "easeOut" },
      );
    }, [animate, shouldReduceMotion]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        style={{ overflow: "visible" }}
      >
        <motion.g className="truck">
          <path d="M14 19V7a2 2 0 0 0-2-2H9" />
          <path d="M15 19H9" />
          <path d="M19 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14" />
          <path d="M2 13v5a1 1 0 0 0 1 1h2" />
          <path d="M4 3 2.15 5.15a.495.495 0 0 0 .35.86h2.15a.47.47 0 0 1 .35.86L3 9.02" />
          <circle cx="17" cy="19" r="2" />
          <circle cx="7" cy="19" r="2" />
        </motion.g>
      </motion.svg>
    );
  },
);

TruckElectricIcon.displayName = "TruckElectricIcon";
export default TruckElectricIcon;
