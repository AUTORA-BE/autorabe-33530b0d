/**
 * Create alert page with multi-criteria form
 * @module pages
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header, Footer } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Bell, Zap, Calendar } from "lucide-react";
import { useCreateAlert } from "@/features/alerts";
import SEOHead from "@/components/SEOHead";

const BRANDS = [
  "Audi", "BMW", "Citroën", "Fiat", "Ford", "Hyundai", "Kia",
  "Mercedes-Benz", "Opel", "Peugeot", "Renault", "Škoda",
  "Toyota", "Volkswagen", "Volvo",
];

const FUEL_TYPES = [
  { value: "diesel", label: "Diesel" },
  { value: "essence", label: "Essence" },
  { value: "électrique", label: "Électrique" },
  { value: "hybride", label: "Hybride" },
];

const alertSchema = z.object({
  name: z.string().min(3, "Minimum 3 caractères").max(50),
  brand: z.string().optional(),
  model: z.string().optional(),
  max_price: z.number().min(1000).max(200000).optional().or(z.literal(undefined)),
  min_year: z.number().min(2010).max(2027).optional().or(z.literal(undefined)),
  max_km: z.number().min(0).max(300000).optional().or(z.literal(undefined)),
  fuel_types: z.array(z.string()).optional(),
  lez_compatible: z.boolean().optional(),
  carpass_verified: z.boolean().optional(),
  frequency: z.enum(["instant", "daily", "weekly"]),
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function CreerAlerte() {
  const navigate = useNavigate();
  const createAlert = useCreateAlert();
  const [user, setUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      frequency: "instant",
      fuel_types: [],
      lez_compatible: false,
      carpass_verified: false,
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
      else setUser(user);
    });
  }, [navigate]);

  const onSubmit = async (data: AlertFormData) => {
    await createAlert.mutateAsync({
      name: data.name,
      filters: {
        brand: data.brand || undefined,
        model: data.model || undefined,
        max_price: data.max_price || undefined,
        min_year: data.min_year || undefined,
        max_km: data.max_km || undefined,
        fuel_types: data.fuel_types?.length ? data.fuel_types : undefined,
        lez_compatible: data.lez_compatible || undefined,
        carpass_verified: data.carpass_verified || undefined,
      },
      frequency: data.frequency,
    });
    navigate("/mes-alertes");
  };

  if (!user) return null;

  const fuelTypes = watch("fuel_types") || [];

  return (
    <>
      <SEOHead title="Créer une alerte | AutoRA" description="Définissez vos critères et soyez notifié des nouvelles annonces" />
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-2xl">
          <Button
            variant="ghost"
            className="mb-6 gap-2 rounded-xl"
            onClick={() => navigate("/mes-alertes")}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux alertes
          </Button>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Créer une alerte
          </h1>
          <p className="text-muted-foreground mb-8">
            Définissez vos critères et soyez notifié des nouvelles annonces
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Alert name */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                  Nom de l'alerte
                </Label>
                <Input
                  id="name"
                  placeholder="Ex : Golf diesel pas chère"
                  className="rounded-xl"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Vehicle criteria */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🚗 Critères du véhicule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Marque</Label>
                    <Controller
                      name="brand"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Toutes marques" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRANDS.map((b) => (
                              <SelectItem key={b} value={b.toLowerCase()}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Prix maximum</Label>
                    <Input
                      type="number"
                      placeholder="Ex : 25000"
                      className="rounded-xl"
                      {...register("max_price", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Année minimum</Label>
                    <Input
                      type="number"
                      placeholder="Ex : 2018"
                      className="rounded-xl"
                      {...register("min_year", { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Km maximum</Label>
                    <Input
                      type="number"
                      placeholder="Ex : 100000"
                      className="rounded-xl"
                      {...register("max_km", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Fuel types */}
                <div>
                  <Label className="text-sm mb-2 block">Types de carburant</Label>
                  <div className="flex flex-wrap gap-3">
                    {FUEL_TYPES.map((fuel) => (
                      <label
                        key={fuel.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={fuelTypes.includes(fuel.value)}
                          onCheckedChange={(checked) => {
                            const current = fuelTypes;
                            setValue(
                              "fuel_types",
                              checked
                                ? [...current, fuel.value]
                                : current.filter((f) => f !== fuel.value)
                            );
                          }}
                        />
                        <span className="text-sm">{fuel.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-3 pt-2">
                  <Controller
                    name="lez_compatible"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm">🏙️ Compatible LEZ uniquement</span>
                      </label>
                    )}
                  />
                  <Controller
                    name="carpass_verified"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm">✅ Car-Pass vérifié uniquement</span>
                      </label>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification frequency */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🔔 Fréquence des notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3"
                    >
                      {[
                        {
                          value: "instant",
                          icon: Zap,
                          title: "Instantané (recommandé)",
                          desc: "Recevez un email dès qu'une annonce correspond",
                        },
                        {
                          value: "daily",
                          icon: Calendar,
                          title: "Quotidien",
                          desc: "Un résumé par jour",
                        },
                        {
                          value: "weekly",
                          icon: Calendar,
                          title: "Hebdomadaire",
                          desc: "Un résumé par semaine",
                        },
                      ].map(({ value, icon: Icon, title, desc }) => (
                        <label
                          key={value}
                          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                            field.value === value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <RadioGroupItem value={value} className="mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm flex items-center gap-1.5">
                              <Icon className="w-4 h-4 text-primary" />
                              {title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {desc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => navigate("/mes-alertes")}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl gap-2"
                disabled={createAlert.isPending}
              >
                <Bell className="w-4 h-4" />
                {createAlert.isPending ? "Création..." : "Créer l'alerte"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
