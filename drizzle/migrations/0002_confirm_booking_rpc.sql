CREATE OR REPLACE FUNCTION public.confirm_booking(p_booking_id UUID, p_room_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_status TEXT;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT status INTO v_status FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_status NOT IN ('available', 'cleaning') THEN
    RAISE EXCEPTION 'Room is not available';
  END IF;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  UPDATE public.bookings
     SET room_id = p_room_id,
         verification_code = v_code,
         status = 'confirmed'
   WHERE id = p_booking_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking is no longer pending';
  END IF;

  UPDATE public.rooms SET status = 'reserved' WHERE id = p_room_id;

  RETURN v_code;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_booking(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_booking(UUID, UUID) TO authenticated, service_role;