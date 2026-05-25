/**
 * Modal to change account password.
 * Re-authenticates with current password, then updates via Supabase Auth.
 * @module features/settings/components
 */

import { useState } from "react";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePasswordValidation } from "@/features/auth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function ChangePasswordModal({ open, onOpenChange, email }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const v = usePasswordValidation(next);
  const matches = next.length > 0 && next === confirm;

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
  };

  const handleSubmit = async () => {
    if (!v.isValid) {
      toast.error("Le mot de passe ne respecte pas les critères.");
      return;
    }
    if (!matches) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      // Re-auth with current password
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (reauthErr) {
        toast.error("Mot de passe actuel incorrect.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Mot de passe mis à jour.");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { ok: v.minLength, label: "Au moins 8 caractères" },
    { ok: v.hasUppercase, label: "Une majuscule" },
    { ok: v.hasLowercase, label: "Une minuscule" },
    { ok: v.hasNumber, label: "Un chiffre" },
    { ok: v.hasSpecial, label: "Un caractère spécial" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Pour votre sécurité, confirmez d'abord votre mot de passe actuel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="Mot de passe actuel"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="rounded-xl pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              tabIndex={-1}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            type={show ? "text" : "password"}
            placeholder="Nouveau mot de passe"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            className="rounded-xl"
          />
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirmer le nouveau mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="rounded-xl"
          />

          {next.length > 0 && (
            <ul className="space-y-1 pt-1">
              {rules.map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-2 text-xs ${
                    r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {r.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {r.label}
                </li>
              ))}
              {confirm.length > 0 && (
                <li
                  className={`flex items-center gap-2 text-xs ${
                    matches ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  }`}
                >
                  {matches ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  Les mots de passe correspondent
                </li>
              )}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !v.isValid || !matches || !current}
            className="rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mettre à jour"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChangePasswordModal;
