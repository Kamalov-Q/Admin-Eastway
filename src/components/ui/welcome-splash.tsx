"use client";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type Variant = "success" | "error";

export default function WelcomeSplash({
  open: controlledOpen,
  onClose,
  message = "Re-authenticating",
  product = "Eastway Dashboard",
  duration = 1800,
  variant = "success",
  lines,
}: {
  open?: boolean;
  onClose?: () => void;
  message?: string;
  product?: string;
  duration?: number;
  variant?: Variant;
  lines?: string[];
}) {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(
    controlledOpen ?? true
  );
  const open = controlledOpen ?? internalOpen;

  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      if (controlledOpen === undefined) setInternalOpen(false);
      onClose?.();
    }, duration);
    return () => window.clearTimeout(id);
  }, [open, duration, onClose, controlledOpen]);

  const palette =
    variant === "error"
      ? ["#FB7185", "#FCA5A5", "#F87171", "#FCA5A5", "#FB7185"]
      : ["#A78BFA", "#60A5FA", "#34D399", "#FBBF24", "#F472B6"];

  const emoji = variant === "error" ? "🚫" : "🛡️";
  const monoBorder =
    variant === "error"
      ? "border-red-500/30 text-red-200/90"
      : "border-green-500/20 text-green-300/90";

  const defaultLines =
    variant === "error"
      ? [
          "> validating credentials...",
          "> access denied!",
          "> you are not able to access the dashboard",
        ]
      : [
          "> validating session...",
          "> decrypting profile...",
          "> establishing secure channel...",
          "> redirecting...",
        ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-neutral-950"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,255,255,0.08),transparent_60%)]" />

          {/* floating dots */}
          {[...Array(24)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                background: palette[i % palette.length],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: "blur(0.5px)",
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [-8, 8, -8], opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 0.5,
              }}
            />
          ))}

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="text-6xl md:text-7xl mb-4"
              aria-hidden
            >
              {emoji}
            </motion.div>

            <motion.h2
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
              className="text-center font-extrabold tracking-tight"
            >
              <span className="block text-2xl sm:text-3xl md:text-4xl text-white/90">
                {message}
              </span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-sky-400 to-fuchsia-400 text-3xl sm:text-4xl md:text-5xl drop-shadow">
                {product}
              </span>
            </motion.h2>

            <motion.pre
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className={`mt-4 text-sm sm:text-base font-mono bg-black/40 rounded-lg px-4 py-3 border ${monoBorder}`}
            >
              {(lines ?? defaultLines).join("\n")}
              <motion.span
                className="inline-block w-2 h-4 bg-white/90 align-baseline ml-1"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              />
            </motion.pre>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
              className="mt-4 h-0.5 w-56 bg-linear-to-r from-transparent via-indigo-400 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
