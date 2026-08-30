# Mustay Luxury — Hotel Booking & Reception System

A mobile-first web app with a public guest portal and a protected staff dashboard, backed by Lovable Cloud (database, auth, file storage).

## Design direction

- Deep Slate Navy `#0F172A`, Off-White `#F8FAFC`, Warm Gold `#D97706`, all as semantic theme tokens.
- Luxury serif display headings + clean sans body, generous spacing, gold hairline accents.
- Mobile-first: sticky booking CTA on guest portal, collapsible drawer sidebar for admin on phones.

## Backend

Enable Lovable Cloud, then create:

- `profiles` — id, email, full_name, created_at (auto-created on signup via trigger).
- `user_roles` — separate table with an `app_role` enum (`admin`, `manager`, `receptionist`) plus a `has_role()` security-definer function. Roles are never stored on profiles (privilege-escalation safety).
- `rooms` — room_number (unique), category, price_per_night, capacity, bed_type, amenities[], images[], status, floor.
- `bookings` — booking_number (`MUSTAY-YYMMDD-XXXX`), verification_code, guest details, room_id, room_category, check-in/out dates + times, num_guests, total_amount, payment_status, status, special_requests.
- Storage bucket `room-gallery`: public read, insert/delete restricted to staff roles.
- Seed data in the migration: 12 operational rooms — Deluxe Suite NLe 800 (queen bed w/ netting, en-suite, AC) and Standard Room NLe 700 (double bed, AC) across ground and 1st floor. The 32 upstairs rooms are represented as a construction-pipeline figure in analytics, not as bookable rows.

Access rules:
- Anyone can read rooms (needed for the public showcase) and create a pending booking.
- Guests look up their own booking only through a server function that requires the exact booking number or verification code — the bookings table itself is never publicly readable, so no one can browse other guests' data.
- Staff (any role) can read/update all bookings and rooms.

Admin account `dukuly1300@gmail.com` is created through the sign-up flow on first run and granted the `admin` role; the password you provided is set at that point.

## Pages

**Guest portal `/`** — hero ("Your Home Away From Home in Sierra Leone") with a floating date/lookup widget, capacity pill ("12 Operational Rooms Available Now | 32 Executive Rooms Under Construction"), room showcase cards with photos or a luxury placeholder graphic, amenities and capacity, plus the booking form (dates, check-in time, guests, room category, name, WhatsApp number, special requests, fixed "Pay Upon Arrival at Hotel"). Submitting creates a `pending` booking and shows the booking number with the "Reception will confirm via WhatsApp shortly" notice.

**`/booking-status`** — lookup by booking number or 6-digit code; shows status, and once confirmed a digital voucher with assigned room, verification code, amount due, and an "Open Confirmation on WhatsApp" button.

**`/admin/login`** — email/password sign-in; unauthenticated visits to any `/admin/*` route redirect here. Header reflects session state with a persistent log out in the sidebar.

**`/admin/dashboard`** — metric cards: Active Rooms (12), Construction Pipeline (32), Available Today, Pending Bookings; plus recent activity.

**`/admin/bookings`** — pending requests queue: review a request, pick an available physical room, Confirm Booking generates the 6-digit code and locks the room to `reserved`. Also cancel / no-show actions.

**`/admin/rooms`** — live room grid with colour-coded status (Available, Reserved, Occupied, Cleaning, Maintenance) and one-click status toggle; room editor modal with drag-and-drop photo upload to `room-gallery` and a thumbnail grid where each photo has a red delete button that removes it from storage and the DB array immediately.

**`/admin/reception`** — fast search by guest name or 6-digit code with `Mark Paid & Check-In` and `Check-Out` actions that also move the room to occupied / cleaning.

## Technical notes

- TanStack Start routes; admin pages live under the `_authenticated` gate, guest pages stay public and SSR'd with their own SEO metadata.
- All privileged reads/writes go through server functions with auth middleware; booking lookup is a public server function that requires an exact identifier.
- Booking number and verification code are generated server-side, never in the browser.
- Room availability for a date range is computed server-side against confirmed bookings to prevent double-assignment.

## Out of scope for this build

Online payment capture (payment is on arrival), automated WhatsApp message sending (the button opens WhatsApp with a prefilled message), and booking of the 32 unfinished rooms.
