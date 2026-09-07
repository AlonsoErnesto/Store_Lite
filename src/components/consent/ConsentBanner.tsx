'use client';

import { useEffect, useState } from 'react';

import type { ConsentChoice } from '@/lib/consent/consent';
import { getConsentState, resetConsent, setConsentState } from '@/lib/consent/consentClient';
import { isPlatformTrackingPage } from '@/lib/meta/tenantGuard';

import styles from './ConsentBanner.module.css';

type BannerView = 'idle' | 'banner' | 'chip';

/**
 * Spanish consent banner for platform pages.
 *
 * - pending consent  → full banner with Accept / Decline actions
 * - decided consent  → small reset chip to clear the cookie and re-show the banner
 * - tenant host, /auth/customer or any non-platform path → renders nothing
 *
 * Copy draft pending DL 1729 legal sign-off.
 */
export default function ConsentBanner() {
  const [view, setView] = useState<BannerView>('idle');

  useEffect(() => {
    if (!isPlatformTrackingPage(window.location.hostname, window.location.pathname)) return;
    setView(getConsentState() === 'pending' ? 'banner' : 'chip');
  }, []);

  if (view === 'idle') return null;

  if (view === 'chip') {
    return (
      <div className={styles.chip} role="complementary" aria-label="Preferencias de seguimiento">
        <span className={styles.chipText}>Preferencias de seguimiento</span>
        <button
          type="button"
          className={styles.chipButton}
          onClick={() => {
            resetConsent();
            setView('banner');
          }}
        >
          Cambiar preferencias
        </button>
      </div>
    );
  }

  const handleChoice = (choice: ConsentChoice) => {
    setConsentState(choice);
    setView('chip');
  };

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de privacidad"
    >
      <div className={styles.copy}>
        <h2 className={styles.title}>Valoramos tu privacidad</h2>
        <p className={styles.text}>
          Usamos el píxel de Meta para medir el rendimiento del sitio y ofrecerte una mejor
          experiencia. Puedes aceptar o rechazar el seguimiento en cualquier momento.
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.declineButton}
          onClick={() => handleChoice('declined')}
        >
          Rechazar
        </button>
        <button
          type="button"
          className={styles.acceptButton}
          onClick={() => handleChoice('accepted')}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
