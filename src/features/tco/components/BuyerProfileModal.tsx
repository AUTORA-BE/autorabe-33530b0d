/**
 * Modal de configuration du profil acheteur pour le TCO Matchmaker.
 * Permet de définir région, km/an et budget pour obtenir des scores personnalisés.
 *
 * @module features/tco/components/BuyerProfileModal
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, MapPin, Gauge, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { BuyerProfile } from "../hooks/useBuyerProfile";

interface BuyerProfileModalProps {
  profile: BuyerProfile;
  onSave: (data: Omit<BuyerProfile, "isConfigured">) => void;
  trigger?: React.ReactNode;
}

/**
 * Modal de configuration du profil acheteur
 */
export function BuyerProfileModal({ profile, onSave, trigger }: BuyerProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<BuyerProfile["region"]>(profile.region);
  const [kmPerYear, setKmPerYear] = useState(profile.kmPerYear);
  const [maxBudget, setMaxBudget] = useState(profile.maxBudget);

  const handleSave = () => {
    onSave({ region, kmPerYear, maxBudget });
    setOpen(false);
    toast.success("Profil acheteur enregistré ! Les scores s'affichent sur chaque annonce.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {profile.isConfigured ? "Modifier mon profil" : "Activer le matching"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Mon profil acheteur
          </DialogTitle>
          <DialogDescription>
            Configurez votre profil pour voir un score personnalisé sur chaque annonce.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Région */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              Ma région
            </Label>
            <Select value={region} onValueChange={(v) => setRegion(v as BuyerProfile["region"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bruxelles">Bruxelles-Capitale</SelectItem>
                <SelectItem value="flandre">Flandre</SelectItem>
                <SelectItem value="wallonie">Wallonie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Km/an */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                Km par an
              </span>
              <span className="text-primary font-bold">
                {kmPerYear.toLocaleString("fr-BE")} km
              </span>
            </Label>
            <Slider
              value={[kmPerYear]}
              onValueChange={([v]) => setKmPerYear(v)}
              min={5000}
              max={60000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 000</span>
              <span>60 000</span>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Budget max
              </span>
              <span className="text-primary font-bold">
                {maxBudget.toLocaleString("fr-BE")} €
              </span>
            </Label>
            <Slider
              value={[maxBudget]}
              onValueChange={([v]) => setMaxBudget(v)}
              min={3000}
              max={100000}
              step={1000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 000 €</span>
              <span>100 000 €</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full gap-2">
            <Sparkles className="w-4 h-4" />
            Enregistrer mon profil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
