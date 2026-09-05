# Mustay luxury hotel

Build a complete, production-ready, mobile-first Web Application from scratch for "Mustay Luxury", a hotel in Sierra Leone expanding from 12 operational rooms to 44 total rooms (12 finished and operating, 32 under construction upstairs).



### TECH STACK & ARCHITECTURE

- Frontend: React, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI components.

- Backend & Database: Supabase (PostgreSQL, Supabase Auth, Row Level Security, Supabase Storage).

- Multi-Role Support: Guest (Public Portal) and Admin/Staff (Protected Dashboard).



---



### AUTHENTICATION & ADMIN CREDENTIALS



1. Primary Admin Setup:

   - Admin Email: `dukuly1300@gmail.com`

   - Default Password: `MustayAdmin2026!`

2. Role-Based Access Control (RBAC):

   - `profiles` table in Supabase linked to `auth.users` with `role` column (`admin`, `manager`, `receptionist`).

   - Secure all `/admin/*` routes. Unauthenticated users automatically redirect to `/admin/login`.

   - Sidebar with persistent "Log Out" button.



---



### DATABASE SCHEMA & SEED DATA (Supabase)



1. `profiles` (`id`, `email`, `full_name`, `role`, `created_at`)



2. `rooms`

   - `id` (uuid, primary key)

   - `room_number` (text, unique, e.g., "101", "102")

   - `category` (text)

   - `price_per_night` (numeric)

   - `capacity` (integer)

   - `bed_type` (text)

   - `amenities` (text[])

   - `images` (text[], defaults to sleek SVG/CSS placeholder image URLs if empty)

   - `status` ('available', 'reserved', 'occupied', 'cleaning', 'maintenance')

   - `floor` (integer)



3. Default Pricing & Room Seed Categories:

   - **Deluxe Suite (Large Room):** NLe 800/night | Double/Queen Bed with Netting | En-suite Amenities | AC

   - **Standard Room (Small Room):** NLe 700/night | Double Bed | Compact Comfort | AC

   - Seed 12 operational rooms (Ground & 1st floor). Highlight 32 upcoming rooms as "Under Construction / Coming Soon" in admin analytics.



4. `bookings`

   - `id` (uuid, primary key)

   - `booking_number` (text, unique, format: "MUSTAY-YYMMDD-XXXX")

   - `verification_code` (text, 6-digit string)

   - `guest_name` (text)

   - `guest_phone` (text)

   - `guest_email` (text, optional)

   - `room_id` (uuid, references rooms.id, nullable until assigned)

   - `room_category` (text)

   - `check_in_date` (date)

   - `check_in_time` (time, default '14:00')

   - `check_out_date` (date)

   - `check_out_time` (time, default '12:00')

   - `num_guests` (integer)

   - `total_amount` (numeric)

   - `payment_status` ('unpaid_pay_at_hotel', 'paid')

   - `status` ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')

   - `special_requests` (text)

   - `created_at` (timestamp)



---



### SUPABASE STORAGE & DYNAMIC ADMIN PHOTO MANAGEMENT



1. Storage Bucket setup: `room-gallery` (Public READ access, INSERT/DELETE restricted to `admin`).

2. Admin Room Image Manager (`/admin/rooms`):

   - **Placeholder Fallback:** If a room has no custom photos uploaded, display a clean, high-end luxury graphic placeholder on the guest frontend.

   - **Upload Control:** File picker / drag-and-drop zone allowing `dukuly1300@gmail.com` to upload real photos directly to `room-gallery`.

   - **Delete Control:** Thumbnail gallery grid inside the room editor modal. Each uploaded photo has a red `[ Trash / Delete ]` button that deletes the image from Supabase Storage and updates the database array immediately.



---



### CORE PAGES & USER FLOWS



#### 1. Public Guest Portal (`/`)

- Hero Banner: Headline ("Your Home Away From Home in Sierra Leone"), floating check-in date/room lookup widget.

- Capacity Indicator Banner: Professional pill tag showing *"12 Operational Rooms Available Now | 32 Executive Rooms Under Construction"*.

- Rooms Showcase: Deluxe Suite (NLe 800) and Standard Room (NLe 700) cards displaying photos (or clean placeholders if no image uploaded yet), max capacity, amenities, and "Book Now".

- Booking Form:

  - Dates, Check-in Time, Guest count, Room selection.

  - Name, WhatsApp Number, Special Requests.

  - Fixed Payment method: "Pay Upon Arrival at Hotel".

  - Submit -> Status becomes `🟡 pending`. Display `booking_number` + notification: *"Request received! Reception will confirm your reservation via WhatsApp shortly."*



#### 2. Booking Verification (`/booking-status`)

- Enter `booking_number` or 6-digit `verification_code`.

- Displays status. Once `confirmed`, guest sees digital confirmation voucher with Room Assignment, Verification Code, Total Amount Due, and an "Open Confirmation on WhatsApp" button.



#### 3. Protected Admin Panel (`/admin`)

- Login Route (`/admin/login`): Logs in using `dukuly1300@gmail.com`.

- Dashboard (`/admin/dashboard`): Metric cards for Active Rooms (12), Construction Pipeline (32), Available Today, Pending Bookings.

- Pending Requests Queue: Review requests, pick an available physical room (e.g., Room 101), click `[Confirm Booking]`. Confirmation generates the 6-digit `verification_code` and locks the room.

- Live Room Grid & Housekeeping: Visual status cards (🟢 Available, 🟡 Reserved, 🔴 Occupied, 🧹 Cleaning). Toggle room states with 1-click.

- Reception Search Desk: Fast lookup by name or 6-digit code for `[Mark Paid & Check-In]` and `[Check-Out]`.



---



### DESIGN & STYLING

- Luxury Color Palette: Deep Slate Navy (`#0F172A`), Off-White Neutral (`#F8FAFC`), Warm Gold Accents (`#D97706`).

- Fully mobile-responsive layout for both guest portal and admin management.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4092849a-48b7-4ed3-8e11-02dc22586e61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
