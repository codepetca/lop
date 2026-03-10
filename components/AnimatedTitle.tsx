"use client";

import { useState, useEffect } from "react";

type Phase = "wait" | "delete" | "type" | "done";

interface AnimatedTitleProps {
  onDone?: () => void;
}

export function AnimatedTitle({ onDone }: AnimatedTitleProps) {
  const [text, setText] = useState("Pol");
  const [phase, setPhase] = useState<Phase>("wait");
  const [cursorOn, setCursorOn] = useState(true);
  const [carrotVisible, setCarrotVisible] = useState(false);

  useEffect(() => {
    if (phase === "wait") {
      const t = setTimeout(() => setPhase("delete"), 2800);
      return () => clearTimeout(t);
    }
    if (phase === "delete") {
      if (text.length === 0) {
        setPhase("type");
        return;
      }
      const t = setTimeout(() => setText((s) => s.slice(0, -1)), 130);
      return () => clearTimeout(t);
    }
    if (phase === "type") {
      const target = "Lop";
      if (text === target) {
        setPhase("done");
        onDone?.();
        return;
      }
      const t = setTimeout(() => setText(target.slice(0, text.length + 1)), 150);
      return () => clearTimeout(t);
    }
  }, [phase, text]);

  useEffect(() => {
    if (phase === "done") {
      setCursorOn(false);
      const t = setTimeout(() => setCarrotVisible(true), 350);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <>
      {text}
      <span
        aria-hidden
        style={{ display: "inline-block", position: "relative", marginLeft: "0.08em" }}
      >
        <span
          className={`transition-opacity duration-300 ${
            cursorOn ? "opacity-100" : "opacity-0"
          }`}
        >
          l
        </span>

        <span
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
            carrotVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <svg
            viewBox="0 0 14 38"
            style={{ width: "0.28em", height: "0.95em", display: "block" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7,0 Q2,13 3,27 L11,27 Q12,13 7,0 Z" fill="#f97316" />
            <path d="M7,27 C7,31 7,35 7,38"  stroke="#16a34a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M7,27 C5,30 2,34 1,37"  stroke="#16a34a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M7,27 C9,30 12,34 13,37" stroke="#16a34a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </>
  );
}
