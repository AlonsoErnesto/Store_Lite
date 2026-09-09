'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  file: File | null;
  onCancel: () => void;
  onApply: (file: File) => void;
}

interface PanState {
  x: number;
  y: number;
}

const MAX_FRAME_RATIO = 0.84; // Mirrors the 8% inset used by the frame styling

function getStageLayout(stage: HTMLDivElement, image: HTMLImageElement) {
  const stageRect = stage.getBoundingClientRect();
  const containScale = Math.min(
    stageRect.width / image.naturalWidth,
    stageRect.height / image.naturalHeight,
  );
  const displayedWidth = image.naturalWidth * containScale;
  const displayedHeight = image.naturalHeight * containScale;
  // Largest square that fits inside the displayed image, capped at 84% of the stage.
  const frameSide = Math.min(stageRect.width * MAX_FRAME_RATIO, displayedWidth, displayedHeight);
  return { stageRect, containScale, frameSide, displayedWidth, displayedHeight };
}

export function ImageCropModal({ file, onCancel, onApply }: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [frameSide, setFrameSide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panRef = useRef(pan);
  panRef.current = pan;
  const dragStartRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFrameSide(0);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const measureFrame = useCallback(() => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image || !image.naturalWidth) return;
    setFrameSide(getStageLayout(stage, image).frameSide);
  }, []);

  if (!file || !imageUrl) return null;
  if (typeof document === 'undefined') return null;

  const clampPan = (
    clientX: number,
    clientY: number,
    start: { startX: number; startY: number },
  ) => {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image) return;

    const { frameSide: frame, stageRect } = getStageLayout(stage, image);
    const containScale = Math.min(
      stageRect.width / image.naturalWidth,
      stageRect.height / image.naturalHeight,
    );
    const visualScale = containScale * zoom;
    const visualWidth = image.naturalWidth * visualScale;
    const visualHeight = image.naturalHeight * visualScale;
    // Keep the fixed frame fully inside the displayed image.
    const maxX = Math.max(0, (visualWidth - frame) / 2);
    const maxY = Math.max(0, (visualHeight - frame) / 2);

    setPan({
      x: Math.min(maxX, Math.max(-maxX, clientX - start.startX)),
      y: Math.min(maxY, Math.max(-maxY, clientY - start.startY)),
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX - panRef.current.x,
      startY: event.clientY - panRef.current.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    clampPan(event.clientX, event.clientY, dragStartRef.current);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleApply = () => {
    const image = imageRef.current;
    const stage = stageRef.current;
    if (!image || !stage) return;

    const { frameSide: frame, containScale } = getStageLayout(stage, image);
    const visualScale = containScale * zoom;
    const cropSize = frame / visualScale;
    const sourceX = image.naturalWidth / 2 + pan.x / visualScale - cropSize / 2;
    const sourceY = image.naturalHeight / 2 + pan.y / visualScale - cropSize / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) return;

    setIsProcessing(true);

    // Square crop keeps the exact area inside the visible frame.
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 512, 512);
    canvas.toBlob((blob) => {
      setIsProcessing(false);
      if (!blob) {
        setError('No se pudo generar la imagen recortada. Probá de nuevo.');
        return;
      }
      setError(null);
      onApply(
        new File([blob], file.name.replace(/\.[^/.]+$/, '') + '-cropped.png', {
          type: 'image/png',
          lastModified: Date.now(),
        }),
      );
    }, 'image/png');
  };

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Imagen de perfil</p>
            <h2 id="crop-title">Ajustá tu logo</h2>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div
          ref={stageRef}
          className={styles.cropStage}
          data-dragging={isDragging || undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Previsualización del logo"
            draggable={false}
            onLoad={measureFrame}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
          {frameSide > 0 && (
            <div
              className={styles.cropFrame}
              style={{ width: frameSide, height: frameSide }}
              aria-hidden="true"
            />
          )}
        </div>
        <label className={styles.zoomControl}>
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={isProcessing}
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.applyButton}
            onClick={handleApply}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className={styles.spinner} aria-label="Procesando" />
            ) : (
              'Cortar y guardar'
            )}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
