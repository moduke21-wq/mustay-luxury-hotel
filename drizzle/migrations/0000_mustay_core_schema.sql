-- ROLES ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'receptionist');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

-- NEW USER TRIGGER: profile + bootstrap admin role for the hotel owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'dukuly1300@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROOMS
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price_per_night NUMERIC NOT NULL DEFAULT 700,
  capacity INTEGER NOT NULL DEFAULT 2,
  bed_type TEXT NOT NULL DEFAULT 'Double Bed',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available',
  floor INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rooms_status_check CHECK (status IN ('available','reserved','occupied','cleaning','maintenance'))
);
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms are publicly viewable" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff can insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update rooms" ON public.rooms FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete rooms" ON public.rooms FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  verification_code TEXT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_category TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL DEFAULT '14:00',
  check_out_date DATE NOT NULL,
  check_out_time TIME NOT NULL DEFAULT '12:00',
  num_guests INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid_pay_at_hotel',
  status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid_pay_at_hotel','paid')),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','checked_in','checked_out','cancelled','no_show'))
);
CREATE INDEX bookings_status_idx ON public.bookings (status);
CREATE INDEX bookings_verification_code_idx ON public.bookings (verification_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view bookings" ON public.bookings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SEED: 12 operational rooms
INSERT INTO public.rooms (room_number, category, price_per_night, capacity, bed_type, amenities, status, floor) VALUES
('101','Deluxe Suite',800,3,'Queen Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water'],'available',1),
('102','Deluxe Suite',800,3,'Queen Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water'],'available',1),
('103','Deluxe Suite',800,3,'Double Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water'],'available',1),
('104','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',1),
('105','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',1),
('106','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',1),
('201','Deluxe Suite',800,3,'Queen Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water','Balcony View'],'available',2),
('202','Deluxe Suite',800,3,'Queen Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water','Balcony View'],'available',2),
('203','Deluxe Suite',800,3,'Double Bed with Netting', ARRAY['Air Conditioning','En-suite Bathroom','Mosquito Netting','Smart TV','Free Wi-Fi','Hot Water'],'available',2),
('204','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',2),
('205','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',2),
('206','Standard Room',700,2,'Double Bed', ARRAY['Air Conditioning','Private Bathroom','Mosquito Netting','TV','Free Wi-Fi'],'available',2);

-- PUBLIC BOOKING CREATION (security definer, called by anon via server function)
CREATE OR REPLACE FUNCTION public.create_guest_booking(
  p_guest_name TEXT,
  p_guest_phone TEXT,
  p_guest_email TEXT,
  p_room_category TEXT,
  p_check_in_date DATE,
  p_check_in_time TIME,
  p_check_out_date DATE,
  p_num_guests INTEGER,
  p_special_requests TEXT
) RETURNS TABLE (booking_number TEXT, total_amount NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_price NUMERIC;
  v_nights INTEGER;
  v_number TEXT;
BEGIN
  IF p_check_out_date <= p_check_in_date THEN
    RAISE EXCEPTION 'Check-out date must be after check-in date';
  END IF;
  IF length(trim(p_guest_name)) < 2 OR length(trim(p_guest_phone)) < 6 THEN
    RAISE EXCEPTION 'Guest name and phone number are required';
  END IF;

  v_price := CASE WHEN p_room_category = 'Deluxe Suite' THEN 800 ELSE 700 END;
  v_nights := GREATEST(1, (p_check_out_date - p_check_in_date));
  v_number := 'MUSTAY-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.bookings b WHERE b.booking_number = v_number) LOOP
    v_number := 'MUSTAY-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
  END LOOP;

  INSERT INTO public.bookings (
    booking_number, guest_name, guest_phone, guest_email, room_category,
    check_in_date, check_in_time, check_out_date, num_guests, total_amount, special_requests
  ) VALUES (
    v_number, trim(p_guest_name), trim(p_guest_phone), nullif(trim(coalesce(p_guest_email,'')),''), p_room_category,
    p_check_in_date, coalesce(p_check_in_time, '14:00'), p_check_out_date, greatest(1, p_num_guests),
    v_price * v_nights, nullif(trim(coalesce(p_special_requests,'')),'')
  );

  RETURN QUERY SELECT v_number, v_price * v_nights;
END;
$$;
REVOKE ALL ON FUNCTION public.create_guest_booking(TEXT,TEXT,TEXT,TEXT,DATE,TIME,DATE,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_booking(TEXT,TEXT,TEXT,TEXT,DATE,TIME,DATE,INTEGER,TEXT) TO anon, authenticated, service_role;

-- PUBLIC BOOKING LOOKUP by exact booking number or verification code
CREATE OR REPLACE FUNCTION public.lookup_booking(p_reference TEXT)
RETURNS TABLE (
  booking_number TEXT, status TEXT, payment_status TEXT, guest_name TEXT,
  room_category TEXT, room_number TEXT, check_in_date DATE, check_in_time TIME,
  check_out_date DATE, check_out_time TIME, num_guests INTEGER,
  total_amount NUMERIC, verification_code TEXT, special_requests TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref TEXT := upper(trim(coalesce(p_reference, '')));
BEGIN
  IF length(v_ref) < 6 THEN RETURN; END IF;
  RETURN QUERY
  SELECT b.booking_number, b.status, b.payment_status, b.guest_name,
         b.room_category, r.room_number, b.check_in_date, b.check_in_time,
         b.check_out_date, b.check_out_time, b.num_guests,
         b.total_amount,
         CASE WHEN b.status IN ('confirmed','checked_in','checked_out') THEN b.verification_code ELSE NULL END,
         b.special_requests
  FROM public.bookings b
  LEFT JOIN public.rooms r ON r.id = b.room_id
  WHERE upper(b.booking_number) = v_ref OR b.verification_code = v_ref
  LIMIT 1;
END;
$$;
REVOKE ALL ON FUNCTION public.lookup_booking(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_booking(TEXT) TO anon, authenticated, service_role;