import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function WelcomeSplash({
  open: controlledOpen,
  onClose,
  message = "Welcome to",
  product = "Eastway Dashboard",
  duration = 1800,
}: {
  open?: boolean;
  onClose?: () => void;
  message?: string;
  product?: string;
  duration?: number;
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
          {[...Array(24)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                background: [
                  "#A78BFA",
                  "#60A5FA",
                  "#F472B6",
                  "#34D399",
                  "#FBBF24",
                ][i % 5],
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
              🫡
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
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
              className="mt-3 h-0.5 w-56 bg-linear-to-r from-transparent via-indigo-400 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
