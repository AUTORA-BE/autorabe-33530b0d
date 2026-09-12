CREATE OR REPLACE FUNCTION public.notify_alerts_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_key text;
BEGIN
  -- Uniquement au passage vers 'approved'
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name = 'cron_shared_token';
  IF v_key IS NULL THEN
    RAISE WARNING 'notify_alerts_on_approval: secret introuvable, alertes non declenchees';
    RETURN NEW;
  END IF;

  -- Appel asynchrone : n'allonge pas la transaction et ne peut pas la faire echouer.
  PERFORM net.http_post(
    url := 'https://jbdsjqoonpieusfvkhyo.supabase.co/functions/v1/match-new-vehicle',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer ' || v_key),
    body := jsonb_build_object('vehicle', jsonb_build_object(
      'id', NEW.id, 'brand', NEW.brand, 'model', NEW.model, 'price', NEW.price,
      'year', NEW.year, 'mileage', NEW.mileage, 'fuel_type', NEW.fuel_type,
      'euro_norm', NEW.euro_norm, 'car_pass_verified', NEW.car_pass_verified,
      'location', NEW.location, 'photos', NEW.photos))
  );
  RETURN NEW;
END;
$function$;