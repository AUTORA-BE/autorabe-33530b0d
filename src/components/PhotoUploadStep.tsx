/**
 * Professional photo upload step for SellCarForm
 * - Multi-upload up to 15 photos
 * - Drag & drop support
 * - Grid preview with individual delete
 * - 8MB limit per photo
 * - Counter display
 * - Uploads to Supabase "vehicle-photos" bucket
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, Camera, ImagePlus, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_PHOTOS = 15;
const MAX_PHOTO_SIZE_MB = 8;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

interface PhotoItem {
  /** Stable unique ID for sorting */
  id: string;
  /** Local preview URL (blob or existing URL) */
  preview: string;
  /** Supabase public URL once uploaded */
  url?: string;
  /** Whether still uploading */
  uploading?: boolean;
  /** Upload progress 0-100 */
  progress?: number;
  /** Whether this is an existing photo (from edit mode or draft) */
  isExisting?: boolean;
}

let photoIdCounter = 0;
const nextPhotoId = () => `photo-${Date.now()}-${++photoIdCounter}`;

interface PhotoUploadStepProps {
  /** Current photos (existing URLs from edit/draft) */
  existingPhotos: string[];
  /** Called when the list of public URLs changes */
  onPhotosChange: (urls: string[], previews: string[]) => void;
  /** Translation function */
  t: (key: string) => string;
}

export function PhotoUploadStep({ existingPhotos, onPhotosChange, t }: PhotoUploadStepProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    existingPhotos.map(url => ({ preview: url, url, isExisting: true }))
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCount = photos.length;
  const uploadedCount = photos.filter(p => p.url || p.isExisting).length;

  const notifyParent = useCallback((items: PhotoItem[]) => {
    const urls = items.filter(p => p.url).map(p => p.url!);
    const previews = items.map(p => p.preview);
    onPhotosChange(urls, previews);
  }, [onPhotosChange]);

  const uploadFile = async (file: File, index: number, currentPhotos: PhotoItem[]): Promise<PhotoItem[]> => {
    const { compressImage } = await import('@/utils/compressImage');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Vous devez être connecté pour uploader des photos.');
      return currentPhotos;
    }

    try {
      const { blob, extension } = await compressImage(file, {
        maxDimension: 1920,
        quality: 0.82,
      });

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      const { error } = await supabase.storage
        .from('vehicle-photos')
        .upload(fileName, blob, {
          contentType: blob.type,
          cacheControl: '31536000',
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error(`Erreur upload: ${file.name}`);
        // Remove failed photo
        const updated = currentPhotos.filter((_, i) => i !== index);
        return updated;
      }

      const { data: urlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(fileName);

      const updated = currentPhotos.map((p, i) =>
        i === index ? { ...p, url: urlData.publicUrl, uploading: false, progress: 100 } : p
      );
      return updated;
    } catch (err) {
      console.error('Compression/upload error:', err);
      const updated = currentPhotos.filter((_, i) => i !== index);
      return updated;
    }
  };

  const processFiles = async (files: File[]) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos atteint.`);
      return;
    }

    const validFiles = files.slice(0, remaining).filter(file => {
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        toast.error(`${file.name} dépasse ${MAX_PHOTO_SIZE_MB} Mo.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newItems: PhotoItem[] = await Promise.all(
      validFiles.map(file => new Promise<PhotoItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ preview: e.target?.result as string, uploading: true, progress: 0 });
        };
        reader.readAsDataURL(file);
      }))
    );

    let currentPhotos = [...photos, ...newItems];
    setPhotos(currentPhotos);
    notifyParent(currentPhotos);

    // Upload each file sequentially to avoid rate limits
    const startIndex = photos.length;
    for (let i = 0; i < validFiles.length; i++) {
      currentPhotos = await uploadFile(validFiles[i], startIndex + i, currentPhotos);
      setPhotos([...currentPhotos]);
      notifyParent(currentPhotos);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];

    // Try to delete from storage if it has a URL and is not an existing photo
    if (photo.url && !photo.isExisting) {
      try {
        const url = new URL(photo.url);
        const pathParts = url.pathname.split('/vehicle-photos/');
        if (pathParts[1]) {
          await supabase.storage.from('vehicle-photos').remove([decodeURIComponent(pathParts[1])]);
        }
      } catch {
        // Ignore delete errors
      }
    }

    // Revoke blob URL if local
    if (photo.preview.startsWith('data:') || photo.preview.startsWith('blob:')) {
      // data URLs don't need revoking, blob URLs do
      if (photo.preview.startsWith('blob:')) {
        URL.revokeObjectURL(photo.preview);
      }
    }

    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    notifyParent(updated);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            {t('sellForm.photosTitle') || 'Photos du véhicule'}
          </CardTitle>
          <Badge
            variant={totalCount > 0 ? 'default' : 'secondary'}
            className={cn(
              'text-sm font-semibold',
              totalCount >= MAX_PHOTOS && 'bg-amber-500 text-white'
            )}
          >
            {totalCount}/{MAX_PHOTOS} photos
          </Badge>
        </div>
        {totalCount > 0 && totalCount !== uploadedCount && (
          <Progress
            value={(uploadedCount / totalCount) * 100}
            className="h-1.5 mt-2"
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        {totalCount < MAX_PHOTOS && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                isDragOver ? 'bg-primary/10' : 'bg-secondary'
              )}>
                <ImagePlus className={cn(
                  'h-7 w-7 transition-colors',
                  isDragOver ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Glissez-déposez vos photos ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou cliquez pour sélectionner · max {MAX_PHOTO_SIZE_MB} Mo/photo · JPG, PNG, WebP
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* Photo grid */}
        {totalCount > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div
                key={`${photo.preview.slice(0, 30)}-${index}`}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group ring-1 ring-border/50"
              >
                <img
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  className={cn(
                    'w-full h-full object-cover transition-opacity',
                    photo.uploading && 'opacity-60'
                  )}
                />

                {/* Upload overlay */}
                {photo.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Delete button */}
                {!photo.uploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Main photo badge */}
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-md shadow-sm">
                    {t('sellForm.photosMain') || 'Principale'}
                  </span>
                )}

                {/* Photo number */}
                {index > 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-background/70 text-foreground text-[10px] font-medium rounded backdrop-blur-sm">
                    {index + 1}
                  </span>
                )}
              </div>
            ))}

            {/* Add more button in grid */}
            {totalCount < MAX_PHOTOS && (
              <label className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-muted/30 hover:bg-muted/50">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Ajouter</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Camera className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground/80 mb-1">Conseils pour de meilleures photos</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Photographiez le véhicule en lumière naturelle</li>
              <li>Incluez l'extérieur (face, arrière, profils), l'intérieur et le tableau de bord</li>
              <li>La première photo sera la photo principale de l'annonce</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
