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

const SimpleCheckedIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (shouldReduceMotion) return;
      await animate(
        ".check-path",
        { pathLength: 0 },
        { duration: 0.1, ease: "easeInOut" },
      );
      await animate(
        ".check-path",
        { pathLength: 1 },
        { duration: 0.4, ease: "easeInOut" },
      );
    }, [animate, shouldReduceMotion]);

    const stop = useCallback(() => {
      if (shouldReduceMotion) return;
      animate(".check-path", { pathLength: 1 }, { duration: 0.2 });
    }, [animate, shouldReduceMotion]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.div ref={scope} onHoverStart={start} onHoverEnd={stop}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className=""
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l5 5l10 -10"
            className={`check-path ${className}`}
          />
        </svg>
      </motion.div>
    );
  },
);

SimpleCheckedIcon.displayName = "SimpleCheckedIcon";
export default SimpleCheckedIcon;
