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

const HeartIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, fill = "none", className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = async () => {
      if (shouldReduceMotion) return;
      await animate(
        ".heart",
        { scale: [1, 1.15, 1, 1.25, 1] },
        { duration: 0.6, ease: "easeOut" },
      );
    };

    const stop = () => {
      if (shouldReduceMotion) return;
      animate(".heart", { scale: 1 }, { duration: 0.2, ease: "easeOut" });
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
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} cursor-pointer`}
        style={{ overflow: "visible" }}
      >
        <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <motion.path
          className="heart"
          fill={fill}
          style={{ transformOrigin: "50% 50%" }}
          d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
        />
      </motion.svg>
    );
  },
);

HeartIcon.displayName = "HeartIcon";

export default HeartIcon;
