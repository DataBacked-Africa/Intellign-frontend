"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem, viewportOnce } from "./motionVariants";

export default function LaunchCta() {
  return (
    <motion.section
      className="launch-cta"
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      <motion.div className="eyebrow" variants={fadeUpItem}>Get started</motion.div>
      <motion.h2 variants={fadeUpItem}>Stop guessing.<br />Start your first <em>optimization</em> today.</motion.h2>
      <motion.p variants={fadeUpItem}>
        Launch the app, describe your problem, and get an explained,
        ready-to-use plan in minutes.
      </motion.p>
      <motion.div className="launch-cta__cta" variants={fadeUpItem}>
        <motion.div
          animate={{ boxShadow: ["0 0 0 0 rgba(244,239,231,0)", "0 0 0 12px rgba(244,239,231,0.08)", "0 0 0 0 rgba(244,239,231,0)"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ borderRadius: 6 }}
        >
          <Link href="/workspace" className="btn btn-primary btn-lg">
            Launch app
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </motion.div>
        <a href="mailto:hello@databackedafrica.com" className="btn btn-secondary btn-lg">Book a demo</a>
      </motion.div>
    </motion.section>
  );
}
