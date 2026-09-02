REVOKE SELECT ON public.car_listings FROM anon, authenticated;

GRANT SELECT (
  id, user_id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, power, doors, euro_norm, car_pass_verified, car_pass_status,
  car_pass_date, first_registration, description, features, photos, location,
  latitude, longitude, status, created_at, updated_at, ct_valid,
  maintenance_book_complete, seller_type, tva_number, boost_level,
  boost_expires_at, boost_rank, reference_url, fuel_consumption, co2, co2_cycle,
  mma, puissance_cv, needs_review, boost_warning_sent, search_vector,
  car_pass_url, car_pass_request_id, coordinates
) ON public.car_listings TO authenticated;

GRANT SELECT (
  id, user_id, brand, model, year, price, mileage, fuel_type, transmission,
  body_type, color, power, doors, euro_norm, car_pass_verified, car_pass_status,
  car_pass_date, first_registration, description, features, photos, location,
  latitude, longitude, status, created_at, updated_at, ct_valid,
  maintenance_book_complete, seller_type, tva_number, boost_level,
  boost_expires_at, boost_rank, reference_url, fuel_consumption, co2, co2_cycle,
  mma, puissance_cv
) ON public.car_listings TO anon;
