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

const CheckedIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = async () => {
      if (shouldReduceMotion) return;
      await animate(
        "svg",
        { scale: 1.1 },
        { duration: 0.1, ease: "easeInOut" },
      );
      await animate(
        ".check-icon",
        { pathLength: 0 },
        { duration: 0.1, ease: "easeInOut" },
      );
      await animate(
        ".check-icon",
        { pathLength: 1 },
        { duration: 0.4, ease: "easeInOut" },
      );
      await animate(
        "svg",
        { scale: 1 },
        { duration: 0.2, ease: "easeInOut" },
      );
    };

    const stop = () => {
      if (shouldReduceMotion) return;
      animate("svg", { scale: 1 }, { duration: 0.2 });
      animate(".check-icon", { pathLength: 1 }, { duration: 0.2 });
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
      <motion.div
        ref={scope}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
      >
        <motion.svg
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
        >
          <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <motion.path d="M9 12l2 2l4 -4" className="check-icon" />
        </motion.svg>
      </motion.div>
    );
  },
);

CheckedIcon.displayName = "CheckedIcon";
export default CheckedIcon;
