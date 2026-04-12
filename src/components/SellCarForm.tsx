import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { vehicleKeys } from '@/features/listings/api/vehicleKeys';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Car, Info, User, Camera, FileCheck, Building2, AlertTriangle, Leaf, CreditCard, ChevronLeft, ChevronRight, Check, FileText, Shield } from 'lucide-react';
import { PhotoUploadStep } from '@/components/PhotoUploadStep';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useListingLimit } from '@/features/subscription';
import { useAutoSaveDraft } from '@/features/listings/hooks/useAutoSaveDraft';

const ConfettiCanvas = lazy(() => import('@/components/ConfettiCanvas'));

const MAX_PHOTOS = 15;
const MAX_PHOTO_SIZE_MB = 8;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

const sellCarSchema = z.object({
  brand: z.string().min(1, "La marque est obligatoire"),
  model: z.string().min(1, "Le modèle est obligatoire"),
  year: z.number()
    .min(1900, "L'année doit être supérieure à 1900")
    .max(new Date().getFullYear(), `L'année ne peut pas dépasser ${new Date().getFullYear()}`),
  price: z.number()
    .min(100, "Le prix doit être d'au moins 100 €")
    .max(1_000_000, "Le prix ne peut pas dépasser 1 000 000 €"),
  mileage: z.number()
    .min(0, "Le kilométrage ne peut pas être négatif")
    .max(999_999, "Le kilométrage ne peut pas dépasser 999 999 km"),
  fuel_type: z.string().min(1, "Le carburant est obligatoire"),
  transmission: z.string().min(1, "La transmission est obligatoire"),
  body_type: z.string().min(1, "Le type de carrosserie est obligatoire"),
  color: z.string().min(1, "La couleur est obligatoire"),
  power: z.number().optional(),
  doors: z.number().optional(),
  euro_norm: z.string().optional(),
  vin: z.string().max(17, "Le VIN doit contenir 17 caractères maximum").optional(),
  first_registration: z.string().optional(),
  description: z.string().optional(),
  contact_name: z.string().min(1, "Le nom de contact est obligatoire"),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Adresse email invalide"),
  location: z.string().optional(),
  car_pass_verified: z.boolean().optional(),
  ct_valid: z.boolean().optional(),
  maintenance_book_complete: z.boolean().optional(),
  seller_type: z.string().optional(),
  tva_number: z.string().optional(),
});

type SellCarFormData = z.infer<typeof sellCarSchema>;

const brands = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Peugeot', 'Renault', 'Citroën',
  'Toyota', 'Honda', 'Ford', 'Opel', 'Hyundai', 'Kia', 'Nissan', 'Mazda',
  'Volvo', 'Skoda', 'Seat', 'Fiat', 'Alfa Romeo', 'Porsche', 'Tesla', 'Mini',
  'Dacia', 'Suzuki', 'Mitsubishi', 'Lexus', 'Jaguar', 'Land Rover', 'Jeep'
];

const euroNorms = ['Euro 6d', 'Euro 6c', 'Euro 6b', 'Euro 6', 'Euro 5', 'Euro 4', 'Euro 3'];

const STEPS = [
  { id: 1, label: 'Informations', icon: Car },
  { id: 2, label: 'Photos', icon: Camera },
  { id: 3, label: 'Documents', icon: FileCheck },
];

/** Données observées en temps réel depuis le formulaire */
export interface SellCarFormWatchData {
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  color?: string;
  euro_norm?: string;
  location?: string;
  seller_type?: string;
  car_pass_verified?: boolean;
  description?: string;
  vin?: string;
  ct_valid?: boolean;
  maintenance_book_complete?: boolean;
  power?: number;
  doors?: number;
  first_registration?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tva_number?: string;
}

interface SellCarFormProps {
  editId?: string;
  /** Callback appelé à chaque changement de données pour la live preview */
  onFormDataChange?: (data: SellCarFormWatchData, photoPreview: string | undefined, photoCount: number) => void;
}

export function SellCarForm({ editId, onFormDataChange }: SellCarFormProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [carPassFile, setCarPassFile] = useState<File | null>(null);
  const [carPassFileName, setCarPassFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [showConfetti, setShowConfetti] = useState(false);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const isEditMode = !!editId;
  const { canPublish, activeCount, maxAllowed, isLoading: limitLoading } = useListingLimit();
  const { updateDraft, loadDraft, clearDraft, lastSaved, isSaving } = useAutoSaveDraft(isEditMode);

  const fuelTypes = [
    { value: 'Essence', label: t('sellForm.fuelGasoline') },
    { value: 'Diesel', label: t('sellForm.fuelDiesel') },
    { value: 'Hybride', label: t('sellForm.fuelHybrid') },
    { value: 'Électrique', label: t('sellForm.fuelElectric') },
    { value: 'Hybride rechargeable', label: t('sellForm.fuelPluginHybrid') },
    { value: 'GPL', label: t('sellForm.fuelLPG') },
  ];

  const transmissions = [
    { value: 'Manuelle', label: t('sellForm.transManual') },
    { value: 'Automatique', label: t('sellForm.transAutomatic') },
  ];

  const bodyTypes = [
    { value: 'Berline', label: t('sellForm.bodySaloon') },
    { value: 'SUV', label: t('sellForm.bodySUV') },
    { value: 'Citadine', label: t('sellForm.bodyHatchback') },
    { value: 'Break', label: t('sellForm.bodyEstate') },
    { value: 'Coupé', label: t('sellForm.bodyCoupe') },
    { value: 'Cabriolet', label: t('sellForm.bodyCabriolet') },
    { value: 'Monospace', label: t('sellForm.bodyMPV') },
    { value: 'Utilitaire', label: t('sellForm.bodyVan') },
  ];

  const colors = [
    { value: 'Noir', label: t('sellForm.colorBlack') },
    { value: 'Blanc', label: t('sellForm.colorWhite') },
    { value: 'Gris', label: t('sellForm.colorGrey') },
    { value: 'Bleu', label: t('sellForm.colorBlue') },
    { value: 'Rouge', label: t('sellForm.colorRed') },
    { value: 'Vert', label: t('sellForm.colorGreen') },
    { value: 'Beige', label: t('sellForm.colorBeige') },
    { value: 'Marron', label: t('sellForm.colorBrown') },
    { value: 'Orange', label: t('sellForm.colorOrange') },
    { value: 'Jaune', label: t('sellForm.colorYellow') },
  ];

  const sellerTypes = [
    { value: 'particulier', label: t('sellForm.individual') },
    { value: 'professionnel', label: t('sellForm.professional') },
  ];

  const form = useForm<SellCarFormData>({
    resolver: zodResolver(sellCarSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      doors: 5,
      seller_type: 'particulier',
      car_pass_verified: false,
      ct_valid: false,
      maintenance_book_complete: false,
    }
  });

  // Load existing listing data for edit mode
  useEffect(() => {
    if (!editId) return;

    const fetchListing = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('car_listings')
          .select('*')
          .eq('id', editId)
          .maybeSingle();

        if (error || !data) {
          toast.error(t('sellForm.notFound'));
          navigate('/dashboard');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (data.user_id !== user?.id) {
          toast.error(t('sellForm.notAuthorized'));
          navigate('/dashboard');
          return;
        }

        form.reset({
          brand: data.brand,
          model: data.model,
          year: data.year,
          price: data.price,
          mileage: data.mileage,
          fuel_type: data.fuel_type,
          transmission: data.transmission,
          body_type: data.body_type,
          color: data.color,
          power: data.power || undefined,
          doors: data.doors || 5,
          euro_norm: data.euro_norm || undefined,
          vin: data.vin || undefined,
          first_registration: data.first_registration || undefined,
          description: data.description || undefined,
          contact_name: data.contact_name,
          contact_phone: data.contact_phone || undefined,
          contact_email: data.contact_email,
          location: data.location || undefined,
          car_pass_verified: data.car_pass_verified || false,
          ct_valid: data.ct_valid || false,
          maintenance_book_complete: data.maintenance_book_complete || false,
          seller_type: data.seller_type || 'particulier',
          tva_number: data.tva_number || undefined,
        });

        if (data.photos && data.photos.length > 0) {
          setExistingPhotos(data.photos);
          setPhotosPreviews(data.photos);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error(t('sellForm.error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [editId]);

  // ── Charger le brouillon au montage (mode création uniquement) ───
  useEffect(() => {
    if (isEditMode) return;
    const load = async () => {
      const draft = await loadDraft();
      if (draft && draft.formData && Object.keys(draft.formData).length > 0) {
        // Check if draft has meaningful data (not just defaults)
        const { brand, model, price } = draft.formData;
        const hasMeaningfulData = brand || model || (price && price > 0);
        if (hasMeaningfulData) {
          form.reset({ ...form.getValues(), ...draft.formData });
          if (draft.photoUrls.length > 0) {
            setExistingPhotos(draft.photoUrls);
            setPhotosPreviews(draft.photoUrls);
          }
          toast.info(t('sellForm.draftRestored') || '📝 Brouillon restauré', {
            description: t('sellForm.draftRestoredDesc') || 'Votre formulaire a été pré-rempli avec vos données précédentes.',
            duration: 4000,
          });
        }
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const totalPhotos = photos.length + existingPhotos.length;
    if (totalPhotos >= MAX_PHOTOS) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_PHOTOS} photos.`);
      return;
    }

    const newPhotos = Array.from(files).slice(0, MAX_PHOTOS - totalPhotos);
    
    newPhotos.forEach(file => {
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        toast.error(`${file.name} dépasse la taille maximale de ${MAX_PHOTO_SIZE_MB} Mo.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotosPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
      setPhotos(prev => [...prev, file]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    const photoUrl = photosPreviews[index];
    if (existingPhotos.includes(photoUrl)) {
      setExistingPhotos(prev => prev.filter(p => p !== photoUrl));
    }
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCarPassUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés pour le Car-Pass.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      toast.error(`Le fichier dépasse la taille maximale de ${MAX_PDF_SIZE_MB} Mo.`);
      return;
    }

    setCarPassFile(file);
    setCarPassFileName(file.name);
    form.setValue('car_pass_verified', true);
  };

  const handleCarPassDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés pour le Car-Pass.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      toast.error(`Le fichier dépasse la taille maximale de ${MAX_PDF_SIZE_MB} Mo.`);
      return;
    }

    setCarPassFile(file);
    setCarPassFileName(file.name);
    form.setValue('car_pass_verified', true);
  };

  const uploadPhotos = async (userId: string): Promise<string[]> => {
    const { compressImage } = await import("@/utils/compressImage");
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      try {
        const { blob, extension } = await compressImage(photo, {
          maxDimension: 1920,
          quality: 0.82,
        });
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
        
        const { error } = await supabase.storage
          .from('car-photos')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '31536000',
          });
        
        if (error) {
          console.error('Upload error:', error);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('car-photos')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
      } catch (err) {
        console.error('Compression/upload error:', err);
      }
    }
    
    return uploadedUrls;
  };

  const uploadCarPass = async (userId: string): Promise<void> => {
    if (!carPassFile) return;
    const fileName = `${userId}/carpass-${Date.now()}.pdf`;
    await supabase.storage.from('car-photos').upload(fileName, carPassFile);
  };

  const onSubmit = async (data: SellCarFormData) => {
    if (!isEditMode && !canPublish) {
      toast.error(`Vous avez atteint la limite de ${maxAllowed} annonces simultanées. Passez à un plan supérieur pour publier davantage.`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('sellForm.loginRequired'));
        navigate('/auth');
        return;
      }

      const hasPhotos = photos.length > 0 || existingPhotos.length > 0;
      if (!hasPhotos) {
        toast.error(t('sellForm.photosRequired'));
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      let allPhotoUrls = [...existingPhotos];
      if (photos.length > 0) {
        const newPhotoUrls = await uploadPhotos(user.id);
        allPhotoUrls = [...allPhotoUrls, ...newPhotoUrls];
      }

      if (allPhotoUrls.length === 0) {
        toast.error(t('sellForm.errorUpload'));
        setIsSubmitting(false);
        return;
      }

      // Upload Car-Pass PDF if present
      await uploadCarPass(user.id);

      const listingData = {
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.price,
        mileage: data.mileage,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        body_type: data.body_type,
        color: data.color,
        power: data.power || null,
        doors: data.doors || 5,
        euro_norm: data.euro_norm || null,
        vin: data.vin || null,
        first_registration: data.first_registration || null,
        description: data.description || null,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email,
        location: data.location || null,
        photos: allPhotoUrls,
        car_pass_verified: data.car_pass_verified || false,
        ct_valid: data.ct_valid || false,
        maintenance_book_complete: data.maintenance_book_complete || false,
        seller_type: data.seller_type || 'particulier',
        tva_number: data.tva_number || null,
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from('car_listings')
          .update(listingData)
          .eq('id', editId);

        if (error) {
          console.error('Update error:', error);
          toast.error(t('sellForm.error'));
          return;
        }
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
        toast.success(t('sellForm.successEdit'));
        navigate('/dashboard');
      } else {
        const { error } = await supabase
          .from('car_listings')
          .insert({
            user_id: user.id,
            status: 'pending',
            ...listingData,
          });

        if (error) {
          console.error('Insert error:', error);
          toast.error(t('sellForm.error'));
          return;
        }
        // Invalider le cache React Query
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
        // Supprimer le brouillon après publication
        await clearDraft();
        // Confetti !
        setShowConfetti(true);
        toast.success('🎉 Félicitations ! En tant que membre fondateur, votre annonce est publiée gratuitement (Offre de lancement limitée).', { duration: 5000 });
        setTimeout(() => navigate('/dashboard'), 3500);
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(t('sellForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLezWarning = (euroNorm: string | undefined) => {
    if (!euroNorm) return null;
    if (euroNorm === 'Euro 3' || euroNorm === 'Euro 4') {
      return { type: 'error' as const, message: t('sellForm.euroNormHint') };
    }
    if (euroNorm === 'Euro 5') {
      return { type: 'warning' as const, message: t('sellForm.euroNormHint') };
    }
    return { type: 'success' as const, message: t('sellForm.euroNormHint') };
  };

  // ── Live preview data broadcast + auto-save ─────────────────────
  const watchedData = form.watch();
  useEffect(() => {
    const draftFields: SellCarFormWatchData = {
      brand: watchedData.brand,
      model: watchedData.model,
      year: watchedData.year,
      price: watchedData.price,
      mileage: watchedData.mileage,
      fuel_type: watchedData.fuel_type,
      transmission: watchedData.transmission,
      body_type: watchedData.body_type,
      color: watchedData.color,
      euro_norm: watchedData.euro_norm,
      location: watchedData.location,
      seller_type: watchedData.seller_type,
      car_pass_verified: watchedData.car_pass_verified,
      description: watchedData.description,
      vin: watchedData.vin,
      ct_valid: watchedData.ct_valid,
      maintenance_book_complete: watchedData.maintenance_book_complete,
      power: watchedData.power,
      doors: watchedData.doors,
      first_registration: watchedData.first_registration,
      contact_name: watchedData.contact_name,
      contact_email: watchedData.contact_email,
      contact_phone: watchedData.contact_phone,
      tva_number: watchedData.tva_number,
    };

    onFormDataChange?.(draftFields, photosPreviews[0], photosPreviews.length);

    // Auto-save draft — only persist actual uploaded URLs, never base64 data URLs
    const persistablePhotoUrls = existingPhotos.filter(url => url.startsWith('http'));
    updateDraft(draftFields, persistablePhotoUrls);
  }, [watchedData, photosPreviews, existingPhotos, onFormDataChange, updateDraft]);

  const selectedEuroNorm = form.watch('euro_norm');
  const lezWarning = getLezWarning(selectedEuroNorm);
  const watchedVin = form.watch('vin');
  const hasValidVin = watchedVin && watchedVin.length === 17;

  // Step validation
  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const result = await form.trigger(['brand', 'model', 'year', 'price', 'mileage', 'fuel_type', 'transmission', 'body_type', 'color', 'contact_name', 'contact_email']);
      return result;
    }
    if (step === 2) {
      const hasPhotos = photos.length > 0 || existingPhotos.length > 0;
      if (!hasPhotos) {
        toast.error('Ajoutez au moins une photo.');
        return false;
      }
      return true;
    }
    return true;
  };

  const goToNextStep = async () => {
    const valid = await validateStep(currentStep);
    if (valid && currentStep < 3) {
      setSlideDirection(1);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setSlideDirection(-1);
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  /** Framer Motion slide variants pour les étapes */
  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Suspense fallback={null}>
          <ConfettiCanvas onComplete={() => setShowConfetti(false)} />
        </Suspense>
      )}

      {/* Auto-save indicator */}
      {!isEditMode && (lastSaved || isSaving) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-2"
        >
          {isSaving ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t('sellForm.saving') || 'Sauvegarde…'}</span>
            </>
          ) : lastSaved ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>
                {t('sellForm.draftSaved') || 'Brouillon sauvegardé'} · {lastSaved.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : null}
        </motion.div>
      )}
      {/* Listing limit banner */}
      {!isEditMode && !canPublish && !limitLoading && (
        <Card className="border-destructive bg-destructive/5 mb-6">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-foreground">
                Limite atteinte ({activeCount}/{maxAllowed} annonces simultanées)
              </p>
              <p className="text-sm text-muted-foreground">
                Supprimez une annonce existante ou passez à un plan supérieur pour continuer.
              </p>
            </div>
            <Link to="/pricing">
              <Button size="sm" className="shrink-0">
                <CreditCard className="h-4 w-4 mr-2" />
                Voir les plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isEditMode && canPublish && !limitLoading && maxAllowed !== null && (
        <div className="mb-6 text-sm text-muted-foreground text-center">
          {activeCount}/{maxAllowed} annonces simultanées utilisées
        </div>
      )}

      {/* Progress Stepper — sticky on mobile */}
      <div className="mb-8 lg:mb-8">
        {/* Mobile: compact sticky stepper */}
        <div className="lg:hidden sticky top-16 z-40 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                          : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Étape {currentStep}/{STEPS.length} · {STEPS[currentStep - 1].label}
            </span>
            <span className="text-muted-foreground">
              {currentStep === STEPS.length ? 'Dernière étape' : `${STEPS.length - currentStep} restante${STEPS.length - currentStep > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Desktop: original stepper */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id < currentStep) setCurrentStep(step.id);
                      }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </button>
                    <span className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 mb-7 rounded-full transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 max-w-lg mx-auto">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <AnimatePresence mode="wait" custom={slideDirection}>
          {/* ===== STEP 1: Vehicle Info + Contact ===== */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={slideDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-8"
            >
              {/* Vehicle Info */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Car className="h-5 w-5 text-primary" />
                    {t('sellForm.vehicleInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.brand')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.model')} *</FormLabel>
                      <FormControl><Input placeholder={t('sellForm.modelPlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.year')} *</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.price')} *</FormLabel>
                      <FormControl><Input type="number" placeholder="25000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="mileage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.mileage')} *</FormLabel>
                      <FormControl><Input type="number" placeholder="50000" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="fuel_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.fuel')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{fuelTypes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="transmission" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.transmission')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{transmissions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="body_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.bodyType')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{bodyTypes.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.color')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{colors.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="power" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.power')}</FormLabel>
                      <FormControl><Input type="number" placeholder="150" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="doors" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.doors')}</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Seller Type */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="h-5 w-5 text-primary" />
                    {t('sellForm.sellerType')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="seller_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.youAre')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{sellerTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {form.watch('seller_type') === 'professionnel' && (
                    <FormField control={form.control} name="tva_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sellForm.vatNumber')}</FormLabel>
                        <FormControl><Input placeholder="BE0123456789" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground mt-1">{t('sellForm.vatHint')}</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  {form.watch('seller_type') === 'particulier' && (
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">{t('sellForm.individualHint')}</p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('sellForm.description')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormControl><Textarea placeholder={t('sellForm.descriptionPlaceholder')} className="min-h-[150px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <User className="h-5 w-5 text-primary" />
                    {t('sellForm.contact')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="contact_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.contactName')} *</FormLabel>
                      <FormControl><Input placeholder={t('sellForm.contactNamePlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="contact_email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.contactEmail')} *</FormLabel>
                      <FormControl><Input type="email" placeholder="votre@email.be" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="contact_phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.contactPhone')}</FormLabel>
                      <FormControl><Input placeholder="+32 xxx xx xx xx" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.location')}</FormLabel>
                      <FormControl><Input placeholder={t('sellForm.locationPlaceholder')} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ===== STEP 2: Photos ===== */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={slideDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Camera className="h-5 w-5 text-primary" />
                  {t('sellForm.photosTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {photosPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                      <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const photoUrl = photosPreviews[index];
                          if (existingPhotos.includes(photoUrl)) {
                            removeExistingPhoto(index);
                          } else {
                            removePhoto(index);
                          }
                        }}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                          {t('sellForm.photosMain')}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {(photos.length + existingPhotos.length) < MAX_PHOTOS && (
                    <label className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/50">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('sellForm.photosAdd')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-4">{t('sellForm.photosHint')}</p>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* ===== STEP 3: Documents (VIN, Car-Pass, Belgian specifics) ===== */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={slideDirection}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-8"
            >
              {/* VIN Field with verified badge */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Shield className="h-5 w-5 text-primary" />
                    Numéro de châssis (VIN)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="vin" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {t('sellForm.vin')}
                        {hasValidVin && (
                          <Badge className="bg-primary/10 text-primary border-0 text-xs animate-in fade-in">
                            <Check className="w-3 h-3 mr-1" />
                            Données techniques vérifiées
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="WVWZZZ3CZWE123456"
                          maxLength={17}
                          {...field}
                          className={hasValidVin ? 'border-primary/50 ring-1 ring-primary/20' : ''}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Le numéro VIN contient 17 caractères. Il se trouve sur la carte grise ou sur le véhicule.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Car-Pass PDF Upload */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    Document Car-Pass
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {carPassFile ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{carPassFileName}</p>
                        <p className="text-xs text-muted-foreground">PDF Car-Pass</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-0 shrink-0">
                        <Check className="w-3 h-3 mr-1" />
                        Car-Pass Disponible
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setCarPassFile(null);
                          setCarPassFileName('');
                          form.setValue('car_pass_verified', false);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleCarPassDrop}
                      className="border-2 border-dashed border-border hover:border-primary transition-colors rounded-xl p-8 text-center cursor-pointer"
                    >
                      <label className="cursor-pointer flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Glissez-déposez votre Car-Pass ici
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ou cliquez pour sélectionner un fichier PDF (max {MAX_PDF_SIZE_MB} Mo)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleCarPassUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Le Car-Pass est obligatoire en Belgique lors de la vente d'un véhicule d'occasion. Il garantit l'historique du kilométrage.
                  </p>
                </CardContent>
              </Card>

              {/* Belgian Specifics with LEZ */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Info className="h-5 w-5 text-primary" />
                    {t('sellForm.belgianInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField control={form.control} name="euro_norm" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {t('sellForm.euroNorm')}
                          <Leaf className="h-4 w-4 text-green-500" />
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                          <SelectContent>{euroNorms.map(norm => <SelectItem key={norm} value={norm}>{norm}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="first_registration" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sellForm.firstRegistration')}</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {lezWarning && (
                    <div className={`p-4 rounded-xl border ${
                      lezWarning.type === 'error'
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : lezWarning.type === 'warning'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                    }`}>
                      <div className="flex items-start gap-3">
                        {lezWarning.type === 'error' || lezWarning.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Leaf className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm">{lezWarning.message}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transparency Indicators */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileCheck className="h-5 w-5 text-primary" />
                    {t('sellForm.transparencyTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">{t('sellForm.transparencyHint')}</p>
                  
                  <FormField control={form.control} name="car_pass_verified" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">{t('sellForm.carPassAvailable')}</FormLabel>
                        <p className="text-sm text-muted-foreground">{t('sellForm.carPassHint')}</p>
                      </div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="ct_valid" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">{t('sellForm.ctValid')}</FormLabel>
                        <p className="text-sm text-muted-foreground">{t('sellForm.ctHint')}</p>
                      </div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="maintenance_book_complete" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">{t('sellForm.maintenanceBook')}</FormLabel>
                        <p className="text-sm text-muted-foreground">{t('sellForm.maintenanceHint')}</p>
                      </div>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={goToPrevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? '/dashboard' : '/')}>
                {t('sellForm.cancel')}
              </Button>
            )}

            {currentStep < 3 ? (
              <Button type="button" onClick={goToNextStep}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
                {isSubmitting
                  ? t('sellForm.submitting')
                  : isEditMode
                    ? t('sellForm.submitEdit')
                    : t('sellForm.submit')
                }
              </Button>
            )}
          </div>
        </form>
      </Form>
    </>
  );
}
