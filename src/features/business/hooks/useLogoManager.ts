'use client';

import { compressImageToMaxSize } from '@/shared/utils/image';
import { updateBusinessLogo } from '@app/actions/business';
import { useState } from 'react';
import type { AlertState } from './useBusinessActions';

export function useLogoManager(
  businessId: string | undefined,
  businessSlug: string | undefined,
  initialLogo: string | null,
  setAlert: (a: AlertState) => void,
) {
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogo);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);

  const handleLogoUpload = async (file: File) => {
    if (!businessId || !businessSlug) return;

    setIsUpdatingLogo(true);
    const compressedFile = await compressImageToMaxSize(file);
    const formDataObj = new FormData();
    formDataObj.append('file', compressedFile);

    const objectUrl = URL.createObjectURL(file);
    try {
      const result = await updateBusinessLogo(businessId, businessSlug, formDataObj);
      if (result.success) {
        setLogoPreview(result.url || objectUrl);
        setAlert({
          open: true,
          description: 'Logo actualizado correctamente',
          color: 'success',
        });
      } else {
        setAlert({
          open: true,
          description: result.error || 'Error al actualizar el logo',
          color: 'error',
        });
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.error('Error updating logo:', err);
      setAlert({
        open: true,
        description: 'Error inesperado al subir el logo',
        color: 'error',
      });
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsUpdatingLogo(false);
    }
  };

  return { logoPreview, setLogoPreview, isUpdatingLogo, handleLogoUpload };
}
