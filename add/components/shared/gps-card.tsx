'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, CheckCircle, XCircle, Loader2, Crosshair } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface GpsCardProps {
  onLocationDetected?: (loc: GpsLocation) => void;
  compact?: boolean;
}

export function GpsCard({ onLocationDetected, compact = false }: GpsCardProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [location, setLocation] = useState<GpsLocation | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: GpsLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setLocation(loc);
        setStatus('granted');
        onLocationDetected?.(loc);
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocationDetected]);

  return (
    <div
      className={cn(
        'glass rounded-xl border border-border/60 overflow-hidden',
        compact ? 'p-4' : 'p-6'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex items-center justify-center rounded-lg shrink-0',
            compact ? 'w-10 h-10' : 'w-12 h-12',
            status === 'granted'
              ? 'bg-primary/15 text-primary'
              : status === 'denied' || status === 'unavailable'
              ? 'bg-destructive/15 text-destructive'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          {status === 'granted' ? (
            <CheckCircle className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          ) : status === 'denied' || status === 'unavailable' ? (
            <XCircle className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          ) : status === 'loading' ? (
            <Loader2 className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} />
          ) : (
            <Crosshair className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
            {t('location.title')}
          </h3>
          {!compact && (
            <p className="text-sm text-muted-foreground mt-1">{t('location.desc')}</p>
          )}

          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.button
                key="allow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={requestLocation}
                className="mt-4 flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-bright transition-all"
              >
                <MapPin className="w-4 h-4" />
                {t('location.allow')}
              </motion.button>
            )}

            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </motion.div>
            )}

            {status === 'granted' && location && (
              <motion.div
                key="granted"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-medium">{t('location.granted')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t('location.accuracy')}: ±{Math.round(location.accuracy)} meters</span>
                </div>
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-2 px-4 h-10 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('location.useThis')}
                </button>
              </motion.div>
            )}

            {status === 'denied' && (
              <motion.div
                key="denied"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-2"
              >
                <p className="text-sm text-destructive font-medium">{t('location.denied')}</p>
                <p className="text-xs text-muted-foreground">{t('location.deniedDesc')}</p>
              </motion.div>
            )}

            {status === 'unavailable' && (
              <motion.div
                key="unavailable"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                <p className="text-sm text-warning font-medium">{t('location.unavailable')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
