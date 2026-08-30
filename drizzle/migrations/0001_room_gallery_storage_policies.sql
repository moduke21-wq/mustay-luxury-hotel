CREATE POLICY "Staff can read room gallery"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'room-gallery' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can upload room gallery"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'room-gallery' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update room gallery"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'room-gallery' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete room gallery"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'room-gallery' AND public.is_staff(auth.uid()));