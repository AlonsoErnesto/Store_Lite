'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { AlertSnackbar } from '@/shared/components/ui/feedback';
import { ImageCropModal } from '@/shared/components/ui/inputs/ImageCropModal';
import type { Business } from '@/types/business';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import styles from './BusinessSettingsModal.module.css';
import DeleteBusinessDialog from './DeleteBusinessDialog';
import { EquipoTab } from './settings-tabs/EquipoTab';
import { NegocioTab } from './settings-tabs/NegocioTab';
import { ProductosTab } from './settings-tabs/ProductosTab';
import { ResultadosTab } from './settings-tabs/ResultadosTab';

interface BusinessSettingsModalProps {
  business: Business | null;
  planType?: string | null;
  open: boolean;
  onClose: () => void;
}

type TabType = 'negocio' | 'productos' | 'resultados' | 'equipo' | 'peligro';

const PREMIUM_PLANS = ['business_pro', 'enterprise_pro'];
const PREMIUM_TABS: TabType[] = ['resultados', 'equipo'];

export default function BusinessSettingsModal({
  business,
  planType,
  open,
  onClose,
}: BusinessSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('negocio');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoToCrop, setLogoToCrop] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPremium = planType ? PREMIUM_PLANS.includes(planType) : false;

  const isTabLocked = (tab: TabType): boolean => !hasPremium && PREMIUM_TABS.includes(tab);

  const handleTabClick = (tab: TabType) => {
    if (isTabLocked(tab)) return;
    setActiveTab(tab);
  };

  const {
    formData,
    handleChange,
    logoPreview,
    isUpdatingLogo,
    isSaving,
    hasChanges,
    alert,
    handleSave,
    handleLogoUpload,
    closeAlert,
  } = useBusinessSettings(business, open);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Prevent scroll when modal is open and handle layout shift
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoToCrop(file);
    e.target.value = '';
  };

  const handleDeleteClick = () => setDeleteDialogOpen(true);
  const handleDeleteDialogClose = () => setDeleteDialogOpen(false);
  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    onClose();
  };

  if (!business || !open) return null;

  const renderTabContent = () => {
    // Show upgrade prompt for locked tabs
    if (isTabLocked(activeTab)) {
      return (
        <div className={styles.contentContainer}>
          <div className={styles.upgradePrompt}>
            <Icon size={48}>lock</Icon>
            <h2 className={styles.sectionTitle} style={{ marginTop: '16px' }}>
              Contenido exclusivo
            </h2>
            <p className={styles.formHint} style={{ textAlign: 'center', maxWidth: '400px' }}>
              Esta sección está disponible solo en los planes <strong>Business Pro</strong> y{' '}
              <strong>Enterprise Pro</strong>. Actualiza tu plan para acceder a métricas avanzadas y
              gestión de equipo.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'negocio':
        return (
          <NegocioTab
            formData={formData}
            handleChange={handleChange}
            logoPreview={logoPreview}
            isUpdatingLogo={isUpdatingLogo}
            isSaving={isSaving}
            hasChanges={hasChanges}
            handleSave={handleSave}
            handleFileChange={handleFileChange}
            fileInputRef={fileInputRef}
          />
        );
      case 'productos':
        return <ProductosTab businessId={business.id} />;
      case 'resultados':
        return <ResultadosTab business={business} />;
      case 'equipo':
        return <EquipoTab businessId={business.id} />;
      case 'peligro':
        return (
          <div className={styles.contentContainer} style={{ paddingBottom: '48px' }}>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--md-sys-color-error)' }}>
              Zona de Peligro
            </h2>
            <p className={styles.formHint}>Estas acciones son irreversibles.</p>
            <div className={styles.actionsCard}>
              <div className={styles.actionsCardInfo}>
                <div className={styles.actionsCardTitle}>Eliminar negocio</div>
                <div className={styles.actionsCardDesc}>
                  Se borrarán todos los datos, productos y pedidos asociados.
                </div>
              </div>
              <md-filled-button
                suppressHydrationWarning
                style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}
                onClick={handleDeleteClick}
              >
                Eliminar definitivamente
              </md-filled-button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}>
      <ImageCropModal
        file={logoToCrop}
        onCancel={() => setLogoToCrop(null)}
        onApply={(file) => {
          setLogoToCrop(null);
          void handleLogoUpload(file);
        }}
      />
      <div className={styles.modalContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>{business.name}</div>

            <button
              className={`${styles.tabButton} ${activeTab === 'negocio' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('negocio')}
            >
              <Icon size={20}>settings</Icon>
              Vista general
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'productos' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('productos')}
            >
              <Icon size={20}>inventory_2</Icon>
              Productos
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'resultados' ? styles.tabButtonActive : ''} ${isTabLocked('resultados') ? styles.tabButtonLocked : ''}`}
              onClick={() => handleTabClick('resultados')}
            >
              <Icon size={20}>{isTabLocked('resultados') ? 'lock' : 'analytics'}</Icon>
              Resultados
              {isTabLocked('resultados') && <Icon size={14}>lock</Icon>}
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'equipo' ? styles.tabButtonActive : ''} ${isTabLocked('equipo') ? styles.tabButtonLocked : ''}`}
              onClick={() => handleTabClick('equipo')}
            >
              <Icon size={20}>{isTabLocked('equipo') ? 'lock' : 'groups'}</Icon>
              Equipo
              {isTabLocked('equipo') && <Icon size={14}>lock</Icon>}
            </button>

            <div
              style={{
                margin: '8px 0',
                borderTop: '1px solid var(--md-sys-color-outline-variant)',
              }}
            />

            <button
              className={styles.tabButton}
              onClick={() => setActiveTab('peligro')}
              style={{ color: 'var(--md-sys-color-error)' }}
            >
              <Icon size={20} style={{ color: 'inherit' }}>
                delete
              </Icon>
              Eliminar Negocio
            </button>
          </div>
        </div>
        <div className={styles.mainContent}>
          {renderTabContent()}
          <div className={styles.closeButtonContainer}>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <Icon size={18}>close</Icon>
            </button>
            <span className={styles.closeHint}>ESC</span>
          </div>
        </div>
      </div>
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        onClose={closeAlert}
      />

      <DeleteBusinessDialog
        business={business ? { id: business.id, name: business.name } : null}
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
