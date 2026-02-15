import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Car, Info, User, Camera, FileCheck, Building2, AlertTriangle, Leaf, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useListingLimit } from '@/features/subscription';

const MAX_PHOTOS = 10;
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

const sellCarSchema = z.object({
  brand: z.string().min(1, "La marque est obligatoire"),
  model: z.string().min(1, "Le modèle est obligatoire"),
  year: z.number()
    .min(1900, "L'année doit être supérieure à 1900")
    .max(new Date().getFullYear() + 1, `L'année ne peut pas dépasser ${new Date().getFullYear() + 1}`),
  price: z.number()
    .min(1, "Le prix est obligatoire")
    .max(1_000_000, "Le prix ne peut pas dépasser 1 000 000 €"),
  mileage: z.number().min(0, "Le kilométrage est obligatoire"),
  fuel_type: z.string().min(1, "Le carburant est obligatoire"),
  transmission: z.string().min(1, "La transmission est obligatoire"),
  body_type: z.string().min(1, "Le type de carrosserie est obligatoire"),
  color: z.string().min(1, "La couleur est obligatoire"),
  power: z.number().optional(),
  doors: z.number().optional(),
  euro_norm: z.string().optional(),
  vin: z.string().optional(),
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

interface SellCarFormProps {
  editId?: string;
}

export function SellCarForm({ editId }: SellCarFormProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const isEditMode = !!editId;
  const { canPublish, activeCount, maxAllowed, isLoading: limitLoading } = useListingLimit();

  // Translated options
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
  }, [editId, form, navigate, t]);

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

  const uploadPhotos = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('car-photos')
        .upload(fileName, photo);
      
      if (error) {
        console.error('Upload error:', error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('car-photos')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
  };

  const onSubmit = async (data: SellCarFormData) => {
    // Block new listings if limit reached (edits are always allowed)
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

      if (isEditMode && editId) {
        const { error } = await supabase
          .from('car_listings')
          .update({
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
          })
          .eq('id', editId);

        if (error) {
          console.error('Update error:', error);
          toast.error(t('sellForm.error'));
          return;
        }

        toast.success(t('sellForm.successEdit'));
        navigate('/dashboard');
      } else {
        const { error } = await supabase
          .from('car_listings')
          .insert({
            user_id: user.id,
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
            status: 'pending',
            car_pass_verified: data.car_pass_verified || false,
            ct_valid: data.ct_valid || false,
            maintenance_book_complete: data.maintenance_book_complete || false,
            seller_type: data.seller_type || 'particulier',
            tva_number: data.tva_number || null,
          });

        if (error) {
          console.error('Insert error:', error);
          toast.error(t('sellForm.error'));
          return;
        }

        toast.success(t('sellForm.success'));
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(t('sellForm.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeExistingPhoto = (index: number) => {
    const photoUrl = photosPreviews[index];
    if (existingPhotos.includes(photoUrl)) {
      setExistingPhotos(prev => prev.filter(p => p !== photoUrl));
    }
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to get LEZ warning based on euro norm
  const getLezWarning = (euroNorm: string | undefined) => {
    if (!euroNorm) return null;
    
    if (euroNorm === 'Euro 3' || euroNorm === 'Euro 4') {
      return {
        type: 'error' as const,
        message: t('sellForm.euroNormHint'),
      };
    }
    if (euroNorm === 'Euro 5') {
      return {
        type: 'warning' as const,
        message: t('sellForm.euroNormHint'),
      };
    }
    return {
      type: 'success' as const,
      message: t('sellForm.euroNormHint'),
    };
  };

  const selectedEuroNorm = form.watch('euro_norm');
  const lezWarning = getLezWarning(selectedEuroNorm);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Photos Section */}
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
              
              {photos.length < 10 && (
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
            <p className="text-sm text-muted-foreground mt-4">
              {t('sellForm.photosHint')}
            </p>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Car className="h-5 w-5 text-primary" />
              {t('sellForm.vehicleInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.brand')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.model')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('sellForm.modelPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.year')} *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.price')} *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="25000"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.mileage')} *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="50000"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.fuel')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fuelTypes.map(fuel => (
                        <SelectItem key={fuel.value} value={fuel.value}>{fuel.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transmission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.transmission')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transmissions.map(trans => (
                        <SelectItem key={trans.value} value={trans.value}>{trans.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.bodyType')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bodyTypes.map(body => (
                        <SelectItem key={body.value} value={body.value}>{body.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.color')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colors.map(color => (
                        <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="power"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.power')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="150"
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.doors')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Belgian Specifics with LEZ hints */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Info className="h-5 w-5 text-primary" />
              {t('sellForm.belgianInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="euro_norm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {t('sellForm.euroNorm')}
                      <Leaf className="h-4 w-4 text-green-500" />
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('sellForm.select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {euroNorms.map(norm => (
                          <SelectItem key={norm} value={norm}>{norm}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sellForm.vin')}</FormLabel>
                    <FormControl>
                      <Input placeholder="WVWZZZ3CZWE123456" maxLength={17} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_registration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sellForm.firstRegistration')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* LEZ Warning Box */}
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
            <p className="text-sm text-muted-foreground mb-4">
              {t('sellForm.transparencyHint')}
            </p>
            
            <FormField
              control={form.control}
              name="car_pass_verified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      {t('sellForm.carPassAvailable')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('sellForm.carPassHint')}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ct_valid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      {t('sellForm.ctValid')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('sellForm.ctHint')}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenance_book_complete"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 p-4 hover:bg-secondary/50 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      {t('sellForm.maintenanceBook')}
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t('sellForm.maintenanceHint')}
                    </p>
                  </div>
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="seller_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.youAre')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sellForm.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sellerTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('seller_type') === 'professionnel' && (
              <FormField
                control={form.control}
                name="tva_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sellForm.vatNumber')}</FormLabel>
                    <FormControl>
                      <Input placeholder="BE0123456789" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('sellForm.vatHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('seller_type') === 'particulier' && (
              <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                {t('sellForm.individualHint')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">{t('sellForm.description')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder={t('sellForm.descriptionPlaceholder')}
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.contactName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('sellForm.contactNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.contactEmail')} *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="votre@email.be" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.contactPhone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+32 xxx xx xx xx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sellForm.location')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('sellForm.locationPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? '/dashboard' : '/')}>
            {t('sellForm.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting 
              ? t('sellForm.submitting')
              : isEditMode 
                ? t('sellForm.submitEdit')
                : t('sellForm.submit')
            }
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}