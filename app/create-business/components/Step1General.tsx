'use client';

import { Button, Icon, IconButton, Select, SelectOption, TextField } from '@/shared/components/ui';
import { getFieldValue } from '@/shared/utils/domElements';
import { normalizeName, validateNameMatch } from '@/shared/validators/business';
import { useRef } from 'react';
import { useRucVerification } from '../hooks/useRucVerification';
import type { StepProps } from '../types';

interface Step1GeneralProps extends StepProps {
  onFileChange?: (file: File | null) => void;
}

export default function Step1General({
  formData,
  onChange,
  errors,
  onFileChange,
  onVerificationChange,
}: Step1GeneralProps) {
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const {
    isRucVerified,
    isVerifying,
    verifyError,
    showValidationModal,
    verificationResult,
    dniData,
    pjRepData,
    handleVerifyRuc,
    setVerifyError,
    setShowValidationModal,
    setDniData,
    setPjRepData,
    setIsRucVerified,
  } = useRucVerification({
    formData,
    onChange,
    onVerificationChange,
  });

  return (
    <>
      {/* Row 1: Person Type (Auto-detected) & Country */}
      <div className="flex-responsive-row gap-md">
        <TextField
          label="Tipo de Persona (Detectado)"
          variant="outlined"
          style={{ flex: 1 }}
          value={
            isRucVerified && verificationResult?.personType
              ? verificationResult.personType === 'natural'
                ? 'Persona Natural (con Negocio)'
                : 'Persona Jurídica'
              : 'Se detectará al verificar RUC'
          }
          disabled={true}
        />

        <Select label="País" outlined style={{ flex: 1 }} value="Perú" disabled={true}>
          <SelectOption value="Perú" selected={true}>
            Perú
          </SelectOption>
        </Select>
      </div>

      {/* Row 2: RUC Input with Verify Button Inside */}
      <div style={{ position: 'relative', flex: 1 }}>
        <TextField
          label="RUC"
          placeholder="12345678901"
          variant="outlined"
          style={{ width: '100%' }}
          value={formData.taxId}
          maxLength={11}
          onInput={(e: React.FormEvent<HTMLElement>) => {
            const value = getFieldValue(e).replace(/\D/g, '');
            onChange('taxId', value);
            setIsRucVerified(false);
            setVerifyError(null);
          }}
          error={!!errors.taxId}
          errorText={errors.taxId}
          supportingText={isRucVerified ? 'Verificado con SUNAT' : 'Ingrese 11 dígitos (RUC)'}
        />
        <Button
          variant={isRucVerified ? 'tonal' : 'filled'}
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
            transform: 'translateY(0)',
            borderRadius: '100px',
            padding: '8px 16px',
            minWidth: '100px',
            height: '36px',
          }}
          onClick={handleVerifyRuc}
          disabled={isVerifying || !formData.taxId || formData.taxId.length !== 11 || isRucVerified}
        >
          {isVerifying ? '...' : isRucVerified ? '✓' : 'Verificar'}
        </Button>
      </div>

      {/* Verification Error Display */}
      {verifyError && (
        <div style={{ color: 'var(--md-sys-color-error)', fontSize: '0.875rem', marginTop: '8px' }}>
          {verifyError}
        </div>
      )}

      {/* MODAL 2: User Validation (Where user types their info) */}
      {showValidationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              backgroundColor: 'var(--md-sys-color-surface)',
              padding: '24px',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {formData.personType === 'natural'
                ? 'Validar Datos Personales'
                : 'Validar Datos del Negocio'}
            </h2>

            {formData.personType === 'natural' ? (
              <>
                <TextField
                  label="RUC"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={formData.taxId}
                  disabled={true}
                />
                <TextField
                  label="Apellidos y Nombres (como aparece en DNI)"
                  variant="outlined"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={dniData.fullName}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const value = getFieldValue(e).toUpperCase();
                    setDniData((prev) => ({ ...prev, fullName: value }));
                  }}
                />
              </>
            ) : (
              <>
                {/* NEW: PJ Representative Validation */}
                <TextField
                  label="RUC"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={formData.taxId}
                  disabled={true}
                />
                <TextField
                  label="DNI/CE del Representante Legal"
                  variant="outlined"
                  style={{ width: '100%' }}
                  value={pjRepData.dni}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const rawValue = getFieldValue(e).replace(/\D/g, '');
                    const value = rawValue.slice(0, 12);
                    setPjRepData((prev) => ({ ...prev, dni: value }));
                  }}
                  placeholder="12345678 (DNI) o 123456789 (CE)"
                  supportingText="Ingrese DNI (8 dígitos) o CE (9 dígitos)"
                />
                <TextField
                  label="Apellidos y Nombres del Representante (como aparece en DNI)"
                  variant="outlined"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={pjRepData.fullName}
                  onInput={(e: React.FormEvent<HTMLElement>) => {
                    const value = getFieldValue(e).toUpperCase();
                    setPjRepData((prev) => ({ ...prev, fullName: value }));
                  }}
                  placeholder="PEPE GARCIA"
                />
              </>
            )}

            {/* Error display inside modal */}
            {verifyError && (
              <div
                style={{
                  color: 'var(--md-sys-color-error)',
                  fontSize: '0.875rem',
                  marginTop: '8px',
                }}
              >
                {verifyError}
              </div>
            )}

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}
            >
              <Button
                variant="filled"
                onClick={async () => {
                  if (formData.personType === 'natural') {
                    if (!validateNameMatch(dniData.fullName, verificationResult?.legalRepName)) {
                      setVerifyError('Verificar apellidos y nombres. No coincide con SUNAT.');
                      return;
                    }
                    onChange('legalRepName', dniData.fullName);
                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  } else {
                    // PJ: Validate representative against API data
                    if (!pjRepData.dni || !pjRepData.fullName) {
                      setVerifyError('Complete DNI y nombre del representante');
                      return;
                    }

                    const representatives = verificationResult?.representatives || [];

                    if (representatives.length === 0) {
                      setVerifyError(
                        'No se encontraron representantes para este RUC. Verifique el RUC nuevamente.',
                      );
                      return;
                    }

                    // Check if DNI + Name match any representative
                    const match = representatives.some((rep: any) => {
                      const repDni = (rep.numero_de_documento || '').trim();
                      const repFullName = normalizeName(rep.nombre || '');

                      const dniMatch = repDni === pjRepData.dni.trim();

                      const inputWords = normalizeName(pjRepData.fullName)
                        .split(' ')
                        .filter((w: string) => w.length > 0);
                      const repWords = repFullName.split(' ').filter((w: string) => w.length > 0);

                      const userWordsInRep = inputWords.every((word: string) =>
                        repFullName.includes(word),
                      );

                      const missingWords = repWords.filter(
                        (word: string) => !normalizeName(pjRepData.fullName).includes(word),
                      );
                      const repWordsInUser = missingWords.length <= 1;

                      return dniMatch && userWordsInRep && repWordsInUser;
                    });

                    if (!match) {
                      setVerifyError(
                        'El DNI y nombre ingresados no coinciden con los representantes legales registrados en SUNAT para este RUC.',
                      );
                      return;
                    }

                    // SUCCESS! Save validated data
                    onChange('departamento', verificationResult?.departamento || '');
                    onChange('provincia', verificationResult?.provincia || '');
                    onChange('distrito', verificationResult?.distrito || '');
                    const fullAddress = `${verificationResult?.departamento || ''}, ${verificationResult?.provincia || ''}, ${verificationResult?.distrito || ''}`;
                    onChange('address', fullAddress);
                    onChange('commercialName', verificationResult?.razonSocial || '');
                    onChange('legalRepName', pjRepData.fullName);

                    setShowValidationModal(false);
                    setVerifyError(null);
                    onVerificationChange?.(true);
                  }
                }}
                disabled={
                  formData.personType === 'natural'
                    ? !dniData.fullName
                    : !pjRepData.dni || !pjRepData.fullName
                }
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Commercial Name */}
      <TextField
        label={formData.personType === 'natural' ? 'Nombre Comercial (opcional)' : 'Razón Social'}
        placeholder={formData.personType === 'natural' ? 'Mi Negocio' : formData.commercialName}
        variant="outlined"
        style={{ width: '100%' }}
        value={formData.commercialName}
        maxLength={100}
        disabled={isRucVerified && formData.personType === 'juridica'}
        onInput={(e: React.FormEvent<HTMLElement>) => {
          onChange('commercialName', getFieldValue(e));
        }}
        error={!!errors.commercialName}
        errorText={errors.commercialName}
        supportingText={
          isRucVerified && formData.personType === 'juridica'
            ? 'Verificado por SUNAT (no editable)'
            : ''
        }
      />

      {/* Row 4: Logo Upload */}
      <div className="flex-column gap-sm">
        <label className="body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Logo de la Empresa (Opcional)
        </label>
        <div className="flex-row flex-align-center gap-md">
          <div style={{ position: 'relative' }}>
            <Button
              variant="tonal"
              style={{
                borderRadius: '12px',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => logoUploadRef.current?.click()}
            >
              Subir Logo
              <Icon slot="icon" size={23}>
                upload
              </Icon>
            </Button>
            <input
              id="logo-upload"
              ref={logoUploadRef}
              type="file"
              accept="image/*"
              title="Subir logo de la empresa"
              placeholder="Seleccionar archivo"
              style={{ display: 'none' }}
              tabIndex={-1}
              onChange={(e) => {
                onFileChange?.(e.target.files?.[0] || null);
                e.target.value = '';
              }}
            />
          </div>

          {formData.logo && (
            <div
              className="flex-row flex-align-center gap-sm surface-container-low"
              style={{
                paddingLeft: 20,
                borderRadius: '20px',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <span
                className="label-medium"
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formData.logo.name}
              </span>
              <IconButton onClick={() => onFileChange?.(null)} style={{ padding: '4px' }}>
                <Icon size={18}>close</Icon>
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
