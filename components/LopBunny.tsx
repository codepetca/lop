"use client";

import { useState, useEffect } from "react";

interface LopBunnyProps {
  visible: boolean;
}

export function LopBunny({ visible }: LopBunnyProps) {
  const [entered, setEntered] = useState(false);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEntered(true);
    const t = setTimeout(() => setWiggle(true), 900);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <>
      <style>{`
        @keyframes hopIn {
          0%   { opacity: 0; transform: translateY(10px); }
          55%  { transform: translateY(-5px); }
          78%  { transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes earLeft {
          0%, 100% { transform: rotate(20deg); }
          45%      { transform: rotate(28deg); }
        }
        @keyframes earRight {
          0%, 100% { transform: rotate(-20deg); }
          45%      { transform: rotate(-28deg); }
        }
        .bunny-hop {
          animation: hopIn 0.65s ease-out forwards;
        }
        .ear-l {
          transform-box: fill-box;
          transform-origin: top center;
          transform: rotate(20deg);
        }
        .ear-r {
          transform-box: fill-box;
          transform-origin: top center;
          transform: rotate(-20deg);
        }
        .ear-l.wiggling {
          animation: earLeft 0.9s ease-in-out 3;
        }
        .ear-r.wiggling {
          animation: earRight 0.9s ease-in-out 3;
          animation-delay: 0.15s;
        }
      `}</style>
      <span
        aria-hidden
        className={`inline-block align-middle ${entered ? "bunny-hop" : "opacity-0"}`}
      >
        <svg
          viewBox="0 0 60 60"
          width="38"
          height="38"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left floppy ear */}
          <ellipse
            className={`ear-l${wiggle ? " wiggling" : ""}`}
            cx="17" cy="30" rx="7.5" ry="16"
          />
          {/* Right floppy ear */}
          <ellipse
            className={`ear-r${wiggle ? " wiggling" : ""}`}
            cx="43" cy="30" rx="7.5" ry="16"
          />
          {/* Body */}
          <ellipse cx="30" cy="51" rx="16" ry="9" />
          {/* Head — drawn last so it layers over ear roots */}
          <circle cx="30" cy="27" r="14" />
          {/* Eyes */}
          <circle cx="24" cy="24" r="2" fill="white" />
          <circle cx="36" cy="24" r="2" fill="white" />
          {/* Nose */}
          <circle cx="30" cy="30" r="1.2" fill="white" />
        </svg>
      </span>
    </>
  );
}
