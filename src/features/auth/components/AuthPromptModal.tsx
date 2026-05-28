/**
 * Auth-prompt modal — elegant "friction positive" dialog shown when a guest
 * tries to perform an authenticated action (favorite, contact, message…).
 * @module features/auth/components
 */
import { Heart, MessageCircle, Phone, Bell, Car, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AuthPromptReason =
  | "favorite"
  | "contact"
  | "message"
  | "publish"
  | "dashboard"
  | "alert"
  | "generic";

type CopyEntry = {
  icon: typeof Heart;
  title: string;
  description: string;
};

const COPY: Record<AuthPromptReason, CopyEntry> = {
  favorite: {
    icon: Heart,
    title: "Sauvegardez vos coups de cœur",
    description:
      "Connectez-vous pour sauvegarder vos véhicules favoris, les retrouver sur tous vos appareils et recevoir des alertes prix.",
  },
  contact: {
    icon: Phone,
    title: "Contactez le vendeur",
    description:
      "Connectez-vous pour accéder aux coordonnées du vendeur et démarrer la conversation en toute sécurité.",
  },
  message: {
    icon: MessageCircle,
    title: "Envoyez un message",
    description:
      "Connectez-vous pour discuter directement avec le vendeur via notre messagerie sécurisée.",
  },
  publish: {
    icon: Car,
    title: "Publiez votre annonce",
    description:
      "Connectez-vous pour vendre votre véhicule en quelques minutes et toucher des milliers d'acheteurs.",
  },
  dashboard: {
    icon: Lock,
    title: "Accédez à votre garage",
    description:
      "Connectez-vous pour retrouver vos annonces, vos favoris et votre historique au même endroit.",
  },
  alert: {
    icon: Bell,
    title: "Créez votre alerte",
    description:
      "Connectez-vous pour être notifié dès qu'un véhicule correspond à vos critères.",
  },
  generic: {
    icon: Lock,
    title: "Réservé aux membres",
    description: "Cette fonctionnalité est réservée à nos membres. Connectez-vous pour continuer.",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: AuthPromptReason;
  onLogin: () => void;
  onSignup: () => void;
};

export function AuthPromptModal({ open, onOpenChange, reason, onLogin, onSignup }: Props) {
  const copy = COPY[reason] ?? COPY.generic;
  const Icon = copy.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
          </div>
          <DialogTitle className="font-serif text-2xl">{copy.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button size="lg" className="w-full h-12" onClick={onSignup}>
            Créer un compte gratuit
          </Button>
          <Button size="lg" variant="outline" className="w-full h-12" onClick={onLogin}>
            J'ai déjà un compte — Se connecter
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          La navigation et la consultation des annonces restent libres.
        </p>
      </DialogContent>
    </Dialog>
  );
}
