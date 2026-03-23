-- Run this script in your Supabase SQL Editor to initialize your database tables and seed data

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id text primary key,
    password text not null,
    name text,
    dept text,
    year text,
    address text,
    mobile text,
    email text,
    avatar text
);

-- 2. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    username text primary key,
    password text not null,
    name text
);

-- 3. Create Fees Table
CREATE TABLE IF NOT EXISTS public.fees (
    id bigint primary key,
    user_id text references public.users(id) on delete cascade,
    semester text,
    amount integer,
    status text,
    payment_date text
);

-- 4. Create Bus Pass Table
CREATE TABLE IF NOT EXISTS public.bus_pass (
    user_id text primary key references public.users(id) on delete cascade,
    bus_no text,
    route text,
    valid_till text,
    start_point text
);

-- 5. Create Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
    id bigint primary key,
    title text,
    content text,
    date text,
    category text
);

-- Seed Initial Admin
INSERT INTO public.admins (username, password, name) VALUES ('admin', 'admin123', 'Principal') ON CONFLICT (username) DO NOTHING;

-- Seed Initial Student Data
INSERT INTO public.users (id, password, name, dept, year, address, mobile, email, avatar) VALUES 
('961823205001', 'password', 'Abdullah', 'IT', '3rd Year', 'Parvathipuram', '9447654321', 'abdullah@pjce.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah'),
('961823205002', 'password', 'Arun Kumar', 'CSE', '3rd Year', 'Nagercoil', '9441234567', 'arun@pjce.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun%20Kumar'),
('961823205003', 'password', 'Bhavana S', 'AIDS', '2nd Year', 'Marthandam', '9881230987', 'bhavana@pjce.edu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhavana%20S')
ON CONFLICT (id) DO NOTHING;

-- Seed Feed Data
INSERT INTO public.fees (id, user_id, semester, amount, status, payment_date) VALUES 
(1, '961823205001', 'Semester 5', 42000, 'Paid', '2023-12-20'),
(2, '961823205001', 'Semester 6', 42000, 'Due', NULL),
(3, '961823205002', 'Semester 6', 45000, 'Due', NULL),
(4, '961823205003', 'Semester 3', 48000, 'Due', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Bus Pass Data
INSERT INTO public.bus_pass (user_id, bus_no, route, valid_till, start_point) VALUES 
('961823205001', '27', 'Nagercoil', 'Dec 2026', 'Vadasery'),
('961823205002', '15', 'Kanyakumari', 'Dec 2026', 'Vivekananda Rock'),
('961823205003', '12', 'Marthandam', 'Dec 2026', 'New Bus Stand')
ON CONFLICT (user_id) DO NOTHING;

-- Seed Notice Data
INSERT INTO public.notices (id, title, content, date, category) VALUES 
(1, 'Model Exam Schedule', 'The internal model exams for all departments will start from Feb 10th. Please check your department notice board for detailed timing.', '2026-01-20', 'Exam'),
(2, 'College Cultural Fest', 'Ponjesly Fest 2026 is scheduled for March 15th. Registrations for various events are open now.', '2026-01-22', 'Event'),
(3, 'Library Timings Update', 'The central library will remain open until 8 PM for the upcoming exam season starting next week.', '2026-01-24', 'General')
ON CONFLICT (id) DO NOTHING;
