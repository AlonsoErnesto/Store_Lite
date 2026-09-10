'use server';

import { env } from '@/config/env';
import { createClient } from '@supabase/supabase-js';
import {
  MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES,
  validateProductImageFile,
} from '../utils/productImageValidation';
import { requireOwnedBusinessById, requireOwnedBusinessBySlug } from './authz';

const BUCKET_NAME = 'products';

function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  const businessId = formData.get('businessId') as string | null;

  if (!file) {
    return { publicUrl: null, error: 'Archivo no valido o vacio' };
  }

  if (!businessId) {
    return { publicUrl: null, error: 'Business ID es requerido' };
  }

  const fileValidationError = validateProductImageFile(file, MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES);
  if (fileValidationError) {
    return { publicUrl: null, error: fileValidationError };
  }

  await requireOwnedBusinessById(businessId);

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `productos/${businessId}/${fileName}`;

  try {
    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { publicUrl: null, error: `Error al subir imagen: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return { publicUrl, error: null };
  } catch (err) {
    return {
      publicUrl: null,
      error: err instanceof Error ? err.message : 'Error desconocido al subir imagen',
    };
  }
}

export async function deleteProductImageAction(
  url: string,
  businessId: string,
): Promise<{ success: boolean; error: string | null }> {
  if (!url || !url.includes(BUCKET_NAME)) {
    return { success: true, error: null };
  }

  if (!businessId) {
    return { success: false, error: 'Business ID es requerido' };
  }

  await requireOwnedBusinessById(businessId);

  try {
    const parts = url.split(`${BUCKET_NAME}/`);
    if (parts.length < 2) {
      return { success: true, error: null };
    }

    const filePath = parts[1];
    const expectedPrefix = `productos/${businessId}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      return { success: false, error: 'No autorizado para eliminar este recurso' };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

export async function uploadCategoryImageAction(
  formData: FormData,
): Promise<{ publicUrl: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  const businessSlug = formData.get('businessSlug') as string | null;

  if (!file) {
    return { publicUrl: null, error: 'Archivo no valido o vacio' };
  }

  if (!businessSlug) {
    return { publicUrl: null, error: 'Business slug es requerido' };
  }

  const fileValidationError = validateProductImageFile(file, MAX_PRODUCT_IMAGE_UPLOAD_SIZE_BYTES);
  if (fileValidationError) {
    return { publicUrl: null, error: fileValidationError };
  }

  const { businessId } = await requireOwnedBusinessBySlug(businessSlug);
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `categories/${businessId}/${fileName}`;

  try {
    const adminClient = createAdminClient();
    const { error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { publicUrl: null, error: `Error al subir imagen: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return { publicUrl, error: null };
  } catch (err) {
    return {
      publicUrl: null,
      error: err instanceof Error ? err.message : 'Error desconocido al subir imagen',
    };
  }
}
