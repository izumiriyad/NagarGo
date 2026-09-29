'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative pt-16 pb-8 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background-2 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 rounded-full blur-[100px]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          {icon && (
            <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-4">
              {icon}
            </div>
          )}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display), system-ui' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg mt-3 max-w-2xl mx-auto">{subtitle}</p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
