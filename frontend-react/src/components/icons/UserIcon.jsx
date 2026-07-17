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

const UserIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "" },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const shouldReduceMotion = useReducedMotion();

    const start = useCallback(async () => {
      if (shouldReduceMotion) return;
      animate(
        ".user-avatar",
        {
          scale: 1.05,
          y: -1,
        },
        {
          duration: 0.25,
          ease: "easeOut",
        },
      );
    }, [animate, shouldReduceMotion]);

    const stop = useCallback(async () => {
      if (shouldReduceMotion) return;
      animate(
        ".user-avatar",
        {
          scale: 1,
          y: 0,
        },
        {
          duration: 0.2,
          ease: "easeInOut",
        },
      );
    }, [animate, shouldReduceMotion]);

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
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
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <motion.g
          className="user-avatar"
          style={{ transformOrigin: "50% 50%" }}
        >
          <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
          <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
        </motion.g>
      </motion.svg>
    );
  },
);

UserIcon.displayName = "UserIcon";
export default UserIcon;
