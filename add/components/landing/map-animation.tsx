'use client';

import { motion } from 'framer-motion';
import { Package, MapPin, Bike } from 'lucide-react';

const ROUTE_PATH = 'M60,280 C60,200 120,180 180,200 C240,220 260,140 340,120 C420,100 460,60 520,80';

export function MapAnimation() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden glass border border-border/60">
      {/* Map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background-2 via-background-3 to-background-2" />

      {/* Grid streets */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 580 435" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="streetGrid" width="58" height="58" patternUnits="userSpaceOnUse">
            <path d="M58,0 L0,0 L0,58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D26A" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#24F58A" stopOpacity="1" />
            <stop offset="100%" stopColor="#00D26A" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="580" height="435" fill="url(#streetGrid)" />

        {/* Major roads */}
        <line x1="0" y1="145" x2="580" y2="145" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <line x1="0" y1="290" x2="580" y2="290" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <line x1="193" y1="0" x2="193" y2="435" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <line x1="387" y1="0" x2="387" y2="435" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

        {/* City blocks (subtle) */}
        <rect x="20" y="20" width="150" height="100" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="210" y="20" width="150" height="100" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="410" y="20" width="150" height="100" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="20" y="165" width="150" height="110" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="210" y="165" width="150" height="110" rx="4" fill="rgba(255,255,255,0.03)" />
        <rect x="410" y="165" width="150" height="110" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="20" y="310" width="150" height="105" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="210" y="310" width="150" height="105" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="410" y="310" width="150" height="105" rx="4" fill="rgba(255,255,255,0.02)" />

        {/* Faint full route (always visible) */}
        <path d={ROUTE_PATH} stroke="rgba(0,210,106,0.15)" strokeWidth="3" fill="none" strokeDasharray="6 6" />

        {/* Animated route draw — loops infinitely */}
        <motion.path
          d={ROUTE_PATH}
          stroke="url(#routeGrad)"
          strokeWidth="3.5"
          fill="none"
          filter="url(#glow)"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 6,
            times: [0, 0.45, 0.8, 1],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Pickup pin (start) */}
        <g>
          <motion.circle
            cx="60" cy="280" r="12"
            fill="#00D26A" fillOpacity="0.2"
            animate={{ r: [10, 18, 10], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle cx="60" cy="280" r="6" fill="#00D26A" />
          <circle cx="60" cy="280" r="3" fill="#0A0E14" />
        </g>

        {/* Dropoff pin (end) */}
        <g>
          <motion.circle
            cx="520" cy="80" r="12"
            fill="#24F58A" fillOpacity="0.2"
            animate={{ r: [10, 18, 10], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <circle cx="520" cy="80" r="6" fill="#24F58A" />
          <circle cx="520" cy="80" r="3" fill="#0A0E14" />
        </g>

        {/* Moving rider marker along the route */}
        <motion.g
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            offsetPath: `path('${ROUTE_PATH}')`,
            offsetRotate: 'auto',
          }}
        >
          <circle r="14" fill="#00D26A" fillOpacity="0.25" />
          <circle r="9" fill="#00D26A" />
          <circle r="5" fill="#0A0E14" />
          <motion.circle
            r="14"
            fill="none"
            stroke="#00D26A"
            strokeWidth="1.5"
            animate={{ r: [9, 22], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.g>
      </svg>

      {/* Floating labels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-primary/20"
      >
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Package className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-xs font-medium text-foreground">Pickup</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-primary-bright/30"
      >
        <div className="w-6 h-6 rounded-full bg-primary-bright/20 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-primary-bright" />
        </div>
        <span className="text-xs font-medium text-foreground">Drop-off</span>
      </motion.div>

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur border border-border/60"
      >
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-primary-bright" />
        </span>
        <span className="text-[10px] font-semibold text-primary tracking-wide">LIVE</span>
      </motion.div>

      {/* Rider badge that moves with the marker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 6, times: [0.1, 0.2, 0.8, 1], repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur shadow-lg pointer-events-none"
      >
        <Bike className="w-3 h-3 text-primary-foreground" />
        <span className="text-[10px] font-semibold text-primary-foreground">Rider en route</span>
      </motion.div>
    </div>
  );
}
