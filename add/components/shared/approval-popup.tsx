'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface ApprovalPopupProps {
  show: boolean;
  type: 'approved' | 'rejected';
  title?: string;
  message?: string;
  reason?: string | null;
  onClose: () => void;
}

export function ApprovalPopup({ show, type, title, message, reason, onClose }: ApprovalPopupProps) {
  const isApproved = type === 'approved';
  const defaultTitle = isApproved ? 'Approved Successfully!' : 'Application Rejected';
  const defaultMessage = isApproved
    ? 'Congratulations! Your application has been approved. You can now start accepting orders.'
    : 'Unfortunately, your application has been rejected.';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`glass-strong rounded-2xl border-2 p-8 text-center ${isApproved ? 'border-primary/40' : 'border-destructive/40'}`}>

              {/* Animated icon with rings */}
              <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                {isApproved && (
                  <>
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-primary/30"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-primary/20"
                    />
                  </>
                )}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center ${isApproved ? 'bg-primary/15' : 'bg-destructive/15'}`}
                >
                  {isApproved ? (
                    <CheckCircle className="w-12 h-12 text-primary" />
                  ) : (
                    <XCircle className="w-12 h-12 text-destructive" />
                  )}
                </motion.div>
              </div>

              {/* Confetti dots for approval */}
              {isApproved && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        x: (Math.random() - 0.5) * 300,
                        y: (Math.random() - 0.5) * 300,
                        scale: [0, 1, 0.5],
                      }}
                      transition={{ duration: 1.5, delay: 0.2 + i * 0.05, repeat: Infinity, repeatDelay: 2 }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                      style={{
                        background: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
                      }}
                    />
                  ))}
                </div>
              )}

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold mb-2 ${isApproved ? 'text-primary' : 'text-destructive'}`}
                style={{ fontFamily: 'var(--font-display), system-ui' }}
              >
                {title || defaultTitle}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground mb-4"
              >
                {message || defaultMessage}
              </motion.p>

              {reason && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4 text-left"
                >
                  <p className="text-xs font-medium text-destructive mb-1">Rejection Reason:</p>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className={`w-full h-11 rounded-md font-semibold text-sm transition-all ${
                  isApproved
                    ? 'bg-primary text-primary-foreground hover:bg-primary-bright'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                }`}
              >
                {isApproved ? 'Continue' : 'Close'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RealtimeStatusNotificationProps {
  show: boolean;
  title: string;
  message: string;
  icon?: ReactNode;
  onClose: () => void;
}

export function RealtimeStatusNotification({ show, title, message, icon, onClose }: RealtimeStatusNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-20 left-1/2 z-50 max-w-sm w-[90%]"
        >
          <div className="glass-strong rounded-xl border border-primary/30 p-4 flex items-center gap-3 shadow-lg">
            {icon || <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
