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

import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate, useReducedMotion } from "motion/react";

const scaledStrokeWidth = (strokeWidth, viewBoxSize) => strokeWidth * (viewBoxSize / 24);

const MagnifierIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = async () => {
      if (shouldReduceMotion) return;
      await animate(
        ".magnifier-group",
        {
          x: [0, 1, 0, -1, 0],
          y: [0, -1, -2, -1, 0],
          rotate: [0, -5, 5, -5, 0],
        },
        { duration: 1, ease: "easeInOut" },
      );
    };

    const stop = () => {
      if (shouldReduceMotion) return;
      animate(
        ".magnifier-group",
        { x: 0, y: 0, rotate: 0 },
        { duration: 0.2, ease: "easeOut" },
      );
    };

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    const handleHoverStart = () => {
      start();
    };

    const handleHoverEnd = () => {
      stop();
    };

    return (
      <motion.svg
        ref={scope}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        stroke={color}
        strokeWidth={scaledStrokeWidth(strokeWidth, 32)}
        strokeMiterlimit="10"
        className={`cursor-pointer ${className}`}
        style={{ overflow: "visible" }}
      >
        <motion.g
          className="magnifier-group"
          style={{
            transformOrigin: "13px 13px",
            transformBox: "fill-box",
          }}
        >
          <motion.path d="m21.393,18.565l7.021,7.021c.781.781.781,2.047,0,2.828h0c-.781.781-2.047.781-2.828,0l-7.021-7.021" />
          <motion.circle cx="13" cy="13" r="10" strokeLinecap="square" />
        </motion.g>
      </motion.svg>
    );
  },
);

MagnifierIcon.displayName = "MagnifierIcon";
export default MagnifierIcon;
