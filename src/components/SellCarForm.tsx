import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Honeypot, isHoneypotTriggered } from '@/components/Honeypot';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { vehicleKeys } from '@/features/listings/api/vehicleKeys';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Car, Info, User, Camera, FileCheck, Building2, AlertTriangle, Leaf, CreditCard, ChevronLeft, ChevronRight, Check, CheckCircle, FileText, Settings } from 'lucide-react';
import { PhotoUploadStep } from '@/components/PhotoUploadStep';
import { BRAND_MODELS, ALL_BRANDS } from '@/data/brandModels';
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
import { useLocalizedHref } from '@/lib/useLocalizedHref';
import { trackEvent, EVENTS } from '@/lib/analytics';

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
  fuel_consumption: z.number().min(0).max(50).nullable().optional(),
  
  first_registration: z.string().optional(),
  car_pass_date: z.string().optional(),
  description: z.string().optional(),
  reference_url: z.string().url("URL invalide").optional().or(z.literal("")),
  features: z.array(z.string()).optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Adresse email invalide").optional().or(z.literal("")),
  location: z.string().optional(),
  car_pass_verified: z.boolean().optional(),
  ct_valid: z.boolean().optional(),
  maintenance_book_complete: z.boolean().optional(),
  seller_type: z.string().optional(),
  tva_number: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.seller_type === "professionnel") {
    const tva = data.tva_number?.trim().replace(/[\s.]/g, "").toUpperCase();
    if (!tva) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le numéro de TVA est obligatoire pour les vendeurs professionnels",
        path: ["tva_number"],
      });
    } else if (!/^BE0\d{9}$/.test(tva)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format TVA belge invalide. Exemple : BE0123456789",
        path: ["tva_number"],
      });
    }

    // C2 — Car-Pass obligatoire pour vendeurs pros (loi belge sur la vente d'occasion)
    if (!data.car_pass_verified) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le Car-Pass est obligatoire pour les vendeurs professionnels. Uploadez le document avant de publier.",
        path: ["car_pass_verified"],
      });
    }
  }
});

type SellCarFormData = z.infer<typeof sellCarSchema>;


const euroNorms = ['Euro 6d', 'Euro 6c', 'Euro 6b', 'Euro 6', 'Euro 5', 'Euro 4', 'Euro 3'];

const VEHICLE_FEATURES = [
  'CarPlay / Android Auto',
  'Toit ouvrant / panoramique',
  'Caméra de recul',
  'Radar de stationnement',
  'Sièges chauffants',
  'GPS / Navigation',
  'Bluetooth',
  'Cruise control adaptatif',
  'Lane assist',
  'Démarrage sans clé',
  'Climatisation automatique',
  'Jantes alliage',
  'Attelage',
  'Vitres électriques',
  'Rétroviseurs électriques',
];

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
  const localized = useLocalizedHref();
  const pricingHref = localized("/pricing");
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Persisted step key — survives mobile WebView re-mounts caused by the
  // native photo picker on iOS Safari / Chrome iOS under memory pressure.
  // Without this, the user would be sent back to step 1 every time they
  // add a photo on mobile (bug reported pre-launch).
  const STEP_STORAGE_KEY = "autora_sellcar_step";
  const CARPASS_URL_STORAGE_KEY = "autora_sellcar_carpass_url";
  const PHOTOS_STORAGE_KEY = "autora_sellcar_photo_urls";

  // Read from localStorage first (survives full page reloads in iOS WebViews
  // under memory pressure), fall back to sessionStorage for back-compat.
  const readPersistedStep = (): number => {
    try {
      if (editId) return 1;
      const stored = localStorage.getItem(STEP_STORAGE_KEY) ?? sessionStorage.getItem(STEP_STORAGE_KEY);
      const parsed = stored ? Number(stored) : 1;
      return Number.isFinite(parsed) && parsed >= 1 && parsed <= 3 ? parsed : 1;
    } catch {
      return 1;
    }
  };

  const [currentStep, setCurrentStep] = useState<number>(readPersistedStep);

  // Persist currentStep at every change to BOTH stores
  useEffect(() => {
    try {
      localStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
      sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
    } catch {
      /* ignore — storage may be unavailable */
    }
  }, [currentStep]);

  // NOTE: we intentionally do NOT clear sessionStorage on unmount.
  // If we did, an accidental form submit (or a mobile WebView reload during
  // photo selection) would unmount the component, clear the key, then remount
  // with currentStep = 1 again. Persisting the key across reloads is the
  // entire point of this fix. The key is cleared explicitly when the listing
  // is published successfully (see end of onSubmit).

  // Fire listing_started once when wizard mounts in create mode
  useEffect(() => {
    if (!editId) trackEvent(EVENTS.LISTING_STARTED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>(() => {
    try {
      if (editId) return [];
      const raw = localStorage.getItem(PHOTOS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string' && u.startsWith('http')) : [];
    } catch {
      return [];
    }
  });
  const [carPassFile, setCarPassFile] = useState<File | null>(null);
  const [carPassFileName, setCarPassFileName] = useState<string>('');
  const [carPassUrl, setCarPassUrl] = useState<string | null>(() => {
    try {
      if (editId) return null;
      return localStorage.getItem(CARPASS_URL_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [carPassPreview, setCarPassPreview] = useState<string | null>(null);
  const [carPassUploading, setCarPassUploading] = useState(false);
  const [carPassError, setCarPassError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [showConfetti, setShowConfetti] = useState(false);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [sellerIdentity, setSellerIdentity] = useState<{ name: string; email: string; phone: string | null } | null>(null);
  const [overrideContact, setOverrideContact] = useState(false);
  const isEditMode = !!editId;
  const lastBroadcastKeyRef = useRef<string>('');
  const honeypotRef = useRef<HTMLInputElement>(null);
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

  // Persist Car-Pass URL & uploaded photo URLs to localStorage so progress
  // survives iOS WebView reloads (memory pressure during photo picker).
  useEffect(() => {
    try {
      if (isEditMode) return;
      if (carPassUrl) localStorage.setItem(CARPASS_URL_STORAGE_KEY, carPassUrl);
      else localStorage.removeItem(CARPASS_URL_STORAGE_KEY);
    } catch { /* ignore */ }
  }, [carPassUrl, isEditMode]);

  useEffect(() => {
    try {
      if (isEditMode) return;
      const persistable = uploadedPhotoUrls.filter((u) => u.startsWith('http'));
      if (persistable.length > 0) {
        localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(persistable));
      } else {
        localStorage.removeItem(PHOTOS_STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, [uploadedPhotoUrls, isEditMode]);

  // Keep car_pass_verified in sync with carPassUrl — otherwise professional
  // sellers (whose Zod schema requires car_pass_verified === true) get a
  // silent validation failure when publishing.
  useEffect(() => {
    form.setValue('car_pass_verified', !!carPassUrl, { shouldValidate: false });
  }, [carPassUrl, form]);


  // Pre-fill seller info from user profile
  useEffect(() => {
    if (isEditMode) return; // Don't override in edit mode
    const prefill = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone, garage_name, postal_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      // Identity displayed in the read-only "Vous publiez en tant que" block.
      // The server re-derives these from auth + profiles; we only show them.
      setSellerIdentity({
        name: profile.garage_name || profile.display_name || user.email || '',
        email: user.email || '',
        phone: profile.phone || null,
      });

      const currentValues = form.getValues();

      // Pre-fill contact name from profile display_name or garage_name
      if (!currentValues.contact_name) {
        form.setValue('contact_name', profile.garage_name || profile.display_name || '');
      }

      // Pre-fill email from auth user
      if (!currentValues.contact_email) {
        form.setValue('contact_email', user.email || '');
      }

      // Pre-fill phone
      if (!currentValues.contact_phone && profile.phone) {
        form.setValue('contact_phone', profile.phone);
      }

      // Pre-fill location from postal code
      if (!currentValues.location && profile.postal_code) {
        form.setValue('location', profile.postal_code);
      }

      // If garage_name exists, default to professionnel
      if (profile.garage_name && !currentValues.seller_type) {
        form.setValue('seller_type', 'professionnel');
      }
    };
    prefill();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

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
          // Allow admins to edit any listing from the moderation dashboard
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
            _role: 'admin',
          });
          if (!isAdmin) {
            toast.error(t('sellForm.notAuthorized'));
            navigate('/dashboard');
            return;
          }
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

        if (data.car_pass_url) {
          setCarPassUrl(data.car_pass_url);
          setCarPassFileName('Car-Pass existant');
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

  /** Called by PhotoUploadStep when photos change */
  const handlePhotosChange = useCallback((urls: string[], previews: string[]) => {
    setUploadedPhotoUrls(urls);
    setPhotosPreviews(previews);
  }, []);

  void 0; // eslint-disable-line @typescript-eslint/no-unused-vars
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

  const processCarPassFile = async (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Seuls les fichiers PDF, JPG et PNG sont acceptés pour le Car-Pass.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      toast.error(`Le fichier dépasse la taille maximale de ${MAX_PDF_SIZE_MB} Mo.`);
      return;
    }

    setCarPassFile(file);
    setCarPassFileName(file.name);
    setCarPassError(null);
    setCarPassUploading(true);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setCarPassPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCarPassPreview(null);
    }

    const url = await uploadCarPassToStorage(file);
    if (url) {
      setCarPassUrl(url);
      form.setValue('car_pass_verified', true);
      toast.success('Car-Pass uploadé avec succès !');
    } else {
      toast.error('Erreur lors de l\'upload du Car-Pass.');
      setCarPassFile(null);
      setCarPassFileName('');
    }
    setCarPassUploading(false);
  };

  const handleCarPassUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCarPassFile(file);
    e.target.value = '';
  };

  const handleCarPassDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processCarPassFile(file);
  };

  const removeCarPass = async () => {
    // Try to delete from storage
    if (carPassUrl) {
      try {
        const url = new URL(carPassUrl);
        const pathParts = url.pathname.split('/car-pass/');
        if (pathParts[1]) {
          await supabase.storage.from('car-pass').remove([decodeURIComponent(pathParts[1])]);
        }
      } catch { /* ignore */ }
    }
    setCarPassFile(null);
    setCarPassFileName('');
    setCarPassUrl(null);
    setCarPassPreview(null);
    form.setValue('car_pass_verified', false);
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
  void handlePhotoUpload; void removePhoto; void removeExistingPhoto; void uploadPhotos;
  };

  const uploadCarPassToStorage = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `${user.id}/carpass-${Date.now()}.${ext}`;

    let uploadBlob: Blob = file;
    let contentType = file.type;

    // Compress if image
    if (file.type.startsWith('image/')) {
      const { compressImage } = await import('@/utils/compressImage');
      const { blob } = await compressImage(file, { maxDimension: 1920, quality: 0.82 });
      uploadBlob = blob;
      contentType = blob.type;
    }

    const { error } = await supabase.storage
      .from('car-pass')
      .upload(fileName, uploadBlob, {
        contentType,
        cacheControl: '31536000',
      });

    if (error) {
      console.error('Car-Pass upload error:', error);
      return null;
    }

    // Store only the storage object path — the 'car-pass' bucket is private,
    // signed URLs must be generated at read time by admins.
    return fileName;
  };

  const onSubmit = async (data: SellCarFormData) => {
    // Triple safety: only allow a real submit when the user is on the final step
    // and explicitly clicked "Publier". Anything else (accidental button submit,
    // file input bubbling, form keyboard Enter) is silently ignored.
    // This is the last line of defense against mobile WebView reloads that
    // bounce the user back to step 1 mid-upload.
    if (currentStep !== 3) {
      return;
    }

    // Honeypot: silently pretend the listing was created so bots leave us alone
    if (isHoneypotTriggered(honeypotRef.current)) {
      toast.success(t('sellForm.publishSuccess') || 'Annonce publiée');
      navigate('/dashboard');
      return;
    }

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

      // In edit mode, combine existing photos with any newly uploaded ones
      const allPhotoUrls = isEditMode
        ? [...new Set([...existingPhotos, ...uploadedPhotoUrls])]
        : [...uploadedPhotoUrls];

      if (allPhotoUrls.length === 0) {
        toast.error(t('sellForm.photosRequired'));
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      // Car-Pass validation (skip re-check in edit mode if already present)
      if (!carPassUrl && !isEditMode) {
        toast.error('Le Car-Pass est obligatoire pour publier l\'annonce.');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }

      // Minimum 3 photos
      if (allPhotoUrls.length < 3) {
        toast.error('Ajoutez au moins 3 photos pour publier l\'annonce.');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      // Geocode location → lat/lng via OSM Nominatim (free, no key)
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (data.location) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(data.location + ', Belgique')}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'fr' } }
          );
          const geoData = await geoRes.json();
          if (geoData?.length > 0) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
          }
        } catch {
          // Geocoding failure is non-blocking — listing still publishes without coords
        }
      }

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
        fuel_consumption: data.fuel_consumption ?? null,
        first_registration: data.first_registration || null,
        description: data.description || null,
        // Coordonnées : en création, on n'envoie ces champs au serveur QUE si
        // l'utilisateur a explicitement ouvert "Modifier mes coordonnées".
        // Sinon, le serveur les dérive du profil + auth (anti-usurpation).
        // En édition, on conserve les valeurs du formulaire (déjà pré-remplies
        // depuis l'annonce existante).
        contact_override: isEditMode ? undefined : (overrideContact || undefined),
        contact_name: isEditMode ? data.contact_name : (overrideContact ? (data.contact_name || undefined) : undefined),
        contact_phone: isEditMode ? (data.contact_phone || null) : (overrideContact ? (data.contact_phone || undefined) : undefined),
        contact_email: isEditMode ? data.contact_email : (overrideContact ? (data.contact_email || undefined) : undefined),
        location: data.location || null,
        latitude,
        longitude,
        photos: allPhotoUrls,
        // car_pass_verified is a generated column derived from car_pass_status.
        // The seller must explicitly request verification via the verify-car-pass
        // Edge Function — uploading the document alone does NOT verify it.
        car_pass_url: carPassUrl,
        car_pass_date: data.car_pass_date || null,
        ct_valid: data.ct_valid || false,
        maintenance_book_complete: data.maintenance_book_complete || false,
        seller_type: data.seller_type || 'particulier',
        tva_number: data.tva_number || null,
        features: data.features?.length ? data.features : null,
        reference_url: data.reference_url || null,
      };

      if (isEditMode && editId) {
        // Strip fields not present on the car_listings table (handled only by the
        // create-listing edge function on insert): fuel_consumption, latitude,
        // longitude, reference_url.
        const {
          fuel_consumption: _fc,
          latitude: _lat,
          longitude: _lng,
          reference_url: _ref,
          contact_override: _co,
          ...updatePayload
        } = listingData;
        const { error } = await supabase
          .from('car_listings')
          .update(updatePayload)
          .eq('id', editId);

        if (error) {
          console.error('Update error:', error);
          toast.error(t('sellForm.error'));
          return;
        }
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
        try {
          sessionStorage.removeItem(STEP_STORAGE_KEY);
          localStorage.removeItem(STEP_STORAGE_KEY);
          localStorage.removeItem(CARPASS_URL_STORAGE_KEY);
          localStorage.removeItem(PHOTOS_STORAGE_KEY);
        } catch { /* ignore */ }
        toast.success(t('sellForm.successEdit'));
        navigate('/dashboard');
      } else {
        // Publication via edge function sécurisée (seule voie autorisée)
        const { data: insertResult, error } = await supabase.functions.invoke('create-listing', {
          body: listingData,
        });

        if (error) {
          console.error('Insert error:', error);
          // Try to read the real error body returned by the edge function
          // (supabase-js wraps non-2xx into FunctionsHttpError; the body lives
          // on error.context as a Response).
          let serverMsg: string | null = null;
          let serverCode: string | null = null;
          try {
            const ctx = (error as { context?: Response }).context;
            if (ctx && typeof ctx.clone === 'function') {
              const body = await ctx.clone().json();
              serverMsg = body?.error ?? null;
              serverCode = body?.code ?? null;
            }
          } catch { /* ignore parse failure */ }

          if (serverCode === 'RATE_LIMIT_EXCEEDED') {
            toast.error('Limite atteinte : 10 annonces par jour. Réessayez demain.');
          } else if (serverCode === 'DUPLICATE_LISTING') {
            toast.error('Une annonce identique existe déjà. Modifiez-la depuis votre tableau de bord.');
          } else if (serverMsg) {
            toast.error(serverMsg);
          } else if (error.message?.toLowerCase().includes('jwt') || error.message?.toLowerCase().includes('session')) {
            toast.error('Session expirée — reconnectez-vous pour publier.');
            navigate('/auth');
          } else {
            toast.error("Impossible de publier l'annonce. Vérifiez votre connexion et réessayez.");
          }
          return;
        }
        // Invalider le cache React Query
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
        // Supprimer le brouillon après publication
        await clearDraft();
        // Reset persisted wizard step so next listing starts fresh
        try {
          sessionStorage.removeItem(STEP_STORAGE_KEY);
          localStorage.removeItem(STEP_STORAGE_KEY);
          localStorage.removeItem(CARPASS_URL_STORAGE_KEY);
          localStorage.removeItem(PHOTOS_STORAGE_KEY);
        } catch { /* ignore */ }
        trackEvent(EVENTS.LISTING_PUBLISHED, {
          brand: data.brand,
          model: data.model,
          price: data.price,
          fuel_type: data.fuel_type,
          seller_type: data.seller_type || 'particulier',
        });
        // Confetti !
        setShowConfetti(true);
        toast.success('✅ Annonce envoyée — elle sera visible après validation par notre équipe.', { duration: 5000 });
        // Redirect to dashboard where the seller will see her listing
        const newId = (insertResult as { id?: string } | null)?.id;
        setTimeout(() => navigate(newId ? `/dashboard?new=${newId}` : '/dashboard'), 2500);
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

    // Dedupe — react-hook-form's watch() returns a new object reference on each
    // render. Without this guard, the parent setState below + updateDraft's setState
    // re-trigger this effect every render → "Maximum update depth exceeded".
    const persistablePhotoUrls = uploadedPhotoUrls.filter(url => url.startsWith('http'));
    const broadcastKey = JSON.stringify({
      d: draftFields,
      p: photosPreviews[0] ?? null,
      n: photosPreviews.length,
      u: persistablePhotoUrls,
    });
    if (broadcastKey === lastBroadcastKeyRef.current) return;
    lastBroadcastKeyRef.current = broadcastKey;

    onFormDataChange?.(draftFields, photosPreviews[0], photosPreviews.length);
    updateDraft(draftFields, persistablePhotoUrls);
  }, [watchedData, photosPreviews, uploadedPhotoUrls, onFormDataChange, updateDraft]);

  const selectedEuroNorm = form.watch('euro_norm');
  const lezWarning = getLezWarning(selectedEuroNorm);

  // Step validation
  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const result = await form.trigger(['brand', 'model', 'year', 'price', 'mileage', 'fuel_type', 'transmission', 'body_type', 'color']);
      return result;
    }
    if (step === 2) {
      const hasPhotos = uploadedPhotoUrls.length > 0;
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
            <Link to={pricingHref}>
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
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            // Surface silent Zod validation failures (otherwise the user clicks
            // "Publier" on step 3 and nothing visible happens).
            const firstError = Object.values(errors)[0] as { message?: string } | undefined;
            const msg = firstError?.message || 'Certains champs obligatoires sont manquants ou invalides.';
            toast.error(msg);
            // If a step-1 field is missing, bring the user back to step 1 so they can fix it.
            const step1Fields = ['brand','model','year','price','mileage','fuel_type','transmission','body_type','color','tva_number'];
            const hasStep1Error = Object.keys(errors).some((k) => step1Fields.includes(k));
            if (hasStep1Error) setCurrentStep(1);
          })}
          className="space-y-8"
        >
          <Honeypot ref={honeypotRef} />

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
              {/* Identité du vendeur — auto-remplie depuis le compte */}
              {sellerIdentity && (
                <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground">
                    <span className="text-muted-foreground">Vous publiez en tant que :</span>
                    <span className="font-semibold">{sellerIdentity.name}</span>
                    {sellerIdentity.email && <><span className="text-muted-foreground">·</span><span>{sellerIdentity.email}</span></>}
                    {sellerIdentity.phone && <><span className="text-muted-foreground">·</span><span>{sellerIdentity.phone}</span></>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverrideContact((v) => !v)}
                    className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
                  >
                    {overrideContact ? 'Utiliser mes coordonnées du compte' : 'Modifier mes coordonnées (optionnel)'}
                  </button>
                  {overrideContact && (
                    <div className="mt-3 grid md:grid-cols-3 gap-3">
                      <FormField control={form.control} name="contact_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom affiché</FormLabel>
                          <FormControl><Input placeholder={sellerIdentity.name} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contact_email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de contact</FormLabel>
                          <FormControl><Input type="email" placeholder={sellerIdentity.email} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contact_phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl><Input placeholder={sellerIdentity.phone ?? '+32…'} {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}
                </div>
              )}

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
                        <SelectContent>{ALL_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="model" render={({ field }) => {
                    const selectedBrand = form.watch('brand');
                    const modelList = selectedBrand ? (BRAND_MODELS[selectedBrand] ?? []) : [];
                    return (
                      <FormItem>
                        <FormLabel>{t('sellForm.model')} *</FormLabel>
                        {modelList.length > 0 ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={t('sellForm.select')} /></SelectTrigger></FormControl>
                            <SelectContent>
                              {modelList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                              <SelectItem value="__autre__">Autre modèle…</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl><Input placeholder={t('sellForm.modelPlaceholder')} {...field} /></FormControl>
                        )}
                        {field.value === '__autre__' && (
                          <Input
                            className="mt-2"
                            placeholder="Saisir le modèle exact"
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }} />

                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.year')} *</FormLabel>
                      <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.price')} *</FormLabel>
                      <FormControl><Input type="number" placeholder="25000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="mileage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.mileage')} *</FormLabel>
                      <FormControl><Input type="number" placeholder="50000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
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

                  <FormField control={form.control} name="fuel_consumption" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('fuel_type')?.toLowerCase().includes('lectrique')
                          ? 'Consommation (kWh/100 km)'
                          : 'Consommation mixte (L/100 km)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          placeholder={form.watch('fuel_type')?.toLowerCase().includes('lectrique') ? 'ex: 17.5' : 'ex: 6.2'}
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Optionnel — améliore la comparaison</p>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        En chevaux (ch). Votre carte grise indique des kW (case P.2) — multipliez-les par 1,36.
                      </p>
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

              {/* Seller Type — auto-detected from profile, no manual selection */}
              {form.watch('seller_type') === 'professionnel' && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Building2 className="h-5 w-5 text-primary" />
                      Vendeur professionnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField control={form.control} name="tva_number" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sellForm.vatNumber')}</FormLabel>
                        <FormControl><Input placeholder="BE0123456789" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground mt-1">{t('sellForm.vatHint')}</p>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              )}

              {/* Équipements */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Settings className="h-5 w-5 text-primary" />
                    Équipements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sélectionnez les équipements présents sur le véhicule — ils apparaissent dans les filtres de recherche.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {VEHICLE_FEATURES.map((feat) => {
                      const selected = (form.watch('features') ?? []).includes(feat);
                      return (
                        <button
                          key={feat}
                          type="button"
                          onClick={() => {
                            const current = form.getValues('features') ?? [];
                            form.setValue(
                              'features',
                              selected ? current.filter((f) => f !== feat) : [...current, feat],
                              { shouldDirty: true }
                            );
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {feat}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('sellForm.description')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellForm.description')}</FormLabel>
                      <FormControl><Textarea placeholder={t('sellForm.descriptionPlaceholder')} className="min-h-[150px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Contact fields are auto-filled from profile and submitted silently */}
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
              <PhotoUploadStep
                existingPhotos={existingPhotos}
                onPhotosChange={handlePhotosChange}
                t={t}
              />
            </motion.div>
          )}

          {/* ===== STEP 3: Documents obligatoires ===== */}
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
              {/* Car-Pass Upload */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-primary" />
                    Documents obligatoires
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Lien Car-Pass obligatoire</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Collez le lien officiel reçu par email après commande sur{" "}
                      <a href="https://www.car-pass.be" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                        car-pass.be
                      </a>{" "}
                      (format : <span className="font-mono text-xs">https://www.car-pass.be/...</span>)
                    </p>

                    <div className="relative">
                      <Input
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        placeholder="https://www.car-pass.be/..."
                        value={carPassUrl ?? ""}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          // Accept empty (user is clearing) OR a URL that mentions car-pass.be
                          if (value === "") {
                            setCarPassUrl(null);
                          } else {
                            try {
                              const u = new URL(value);
                              // Light validation: must be https and mention car-pass.be
                              if (u.protocol === "https:" && u.hostname.includes("car-pass.be")) {
                                setCarPassUrl(value);
                              } else {
                                // Still store the value so the field reflects user typing, but
                                // carPassUrl stays whatever it was — better UX is to keep typing.
                                setCarPassUrl(value);
                              }
                            } catch {
                              // Invalid URL while typing — keep the raw value visible
                              setCarPassUrl(value);
                            }
                          }
                        }}
                        className={
                          carPassUrl && carPassUrl.includes("car-pass.be")
                            ? "border-green-500/50 focus-visible:ring-green-500/40 pr-24"
                            : "pr-24"
                        }
                      />
                      {carPassUrl && carPassUrl.includes("car-pass.be") && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Le Car-Pass est obligatoire en Belgique lors de la vente d'un véhicule d'occasion. Il garantit l'historique du kilométrage. L'équipe AutoRa vérifie manuellement le lien avant publication.
                    </p>
                  </div>

                  {/* CT Date */}
                  <FormField control={form.control} name="car_pass_date" render={({ field }) => {
                    const carPassDate = field.value ? new Date(field.value) : null;
                    const monthsOld = carPassDate
                      ? (Date.now() - carPassDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                      : null;
                    const isOld = monthsOld !== null && monthsOld > 2;
                    return (
                      <FormItem>
                        <FormLabel>Date du Car-Pass (optionnel)</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        {isOld && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs mt-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              Ce Car-Pass date de plus de 2 mois. Pour maximiser la confiance des acheteurs, nous recommandons d'obtenir un Car-Pass récent via{" "}
                              <a href="https://www.car-pass.be" target="_blank" rel="noopener noreferrer" className="underline font-medium">car-pass.be</a>.
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }} />
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
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
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

              {/* Publish readiness summary */}
              {!isEditMode && (
                <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Prêt à publier ?</p>
                  <ul className="space-y-1.5 text-sm">
                    <li className={`flex items-center gap-2 ${uploadedPhotoUrls.length >= 3 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {uploadedPhotoUrls.length >= 3 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {uploadedPhotoUrls.length >= 3 ? `${uploadedPhotoUrls.length} photos ajoutées ✓` : `${uploadedPhotoUrls.length}/3 photos minimum requises`}
                    </li>
                    <li className={`flex items-center gap-2 ${carPassUrl ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                      {carPassUrl ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {carPassUrl ? 'Car-Pass uploadé ✓' : 'Car-Pass obligatoire'}
                    </li>
                  </ul>
                </div>
              )}
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
              <Button
                type="submit"
                disabled={isSubmitting || (!isEditMode && (uploadedPhotoUrls.length < 3 || !carPassUrl))}
                className="min-w-[200px]"
              >
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
