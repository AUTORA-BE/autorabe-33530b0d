
-- ============================================
-- TASK 1: Restrict all private table RLS policies TO authenticated
-- ============================================

-- FAVORITES
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their favorites" ON public.favorites;
CREATE POLICY "Users can remove their favorites" ON public.favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view favorites on their listings" ON public.favorites;
CREATE POLICY "Sellers can view favorites on their listings" ON public.favorites
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = favorites.car_listing_id AND car_listings.user_id = auth.uid()));

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;
CREATE POLICY "Users can update messages they received" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- USER_ALERTS
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.user_alerts;
CREATE POLICY "Users can view their own alerts" ON public.user_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own alerts" ON public.user_alerts;
CREATE POLICY "Users can create their own alerts" ON public.user_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.user_alerts;
CREATE POLICY "Users can update their own alerts" ON public.user_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.user_alerts;
CREATE POLICY "Users can delete their own alerts" ON public.user_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- USER_PREFERENCES
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PUSH_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create their own push subscriptions" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REPORTS
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- REVIEWS
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = reviews.car_listing_id AND car_listings.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ALERT_NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own alert notifications" ON public.alert_notifications;
CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications
  FOR SELECT TO authenticated
  USING (alert_id IN (SELECT user_alerts.id FROM user_alerts WHERE user_alerts.user_id = auth.uid()));

-- CAR_LISTINGS (owner/admin policies only - public view stays as-is)
DROP POLICY IF EXISTS "Owners can view their own listings" ON public.car_listings;
CREATE POLICY "Owners can view their own listings" ON public.car_listings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all listings" ON public.car_listings;
CREATE POLICY "Admins can view all listings" ON public.car_listings
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create their own listings" ON public.car_listings;
CREATE POLICY "Users can create their own listings" ON public.car_listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.car_listings;
CREATE POLICY "Users can update their own listings" ON public.car_listings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.car_listings;
CREATE POLICY "Users can delete their own listings" ON public.car_listings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update any listing" ON public.car_listings;
CREATE POLICY "Admins can update any listing" ON public.car_listings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.car_listings;
CREATE POLICY "Admins can delete any listing" ON public.car_listings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- CAR_VIEWS (insert stays open for anonymous tracking, select restricted)
DROP POLICY IF EXISTS "Anyone can insert views" ON public.car_views;
CREATE POLICY "Anyone can insert views" ON public.car_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Sellers can view their listing views" ON public.car_views;
CREATE POLICY "Sellers can view their listing views" ON public.car_views
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM car_listings WHERE car_listings.id = car_views.car_listing_id AND car_listings.user_id = auth.uid()));

-- PROFILES (public read stays, write restricted)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
