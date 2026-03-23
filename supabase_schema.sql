-- Create Users Table
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    dept TEXT,
    year TEXT,
    address TEXT,
    mobile TEXT,
    email TEXT,
    avatar TEXT
);

-- Create Admins Table
CREATE TABLE public.admins (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL
);

-- Create Fees Table
CREATE TABLE public.fees (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    payment_date DATE
);

-- Create Bus Pass Table
CREATE TABLE public.bus_pass (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    bus_no TEXT,
    route TEXT,
    valid_till TEXT,
    start_point TEXT
);

-- Create Notices Table
CREATE TABLE public.notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT
);

-- Insert Default Admin
INSERT INTO public.admins (username, password, name) VALUES ('admin', 'admin123', 'Principal');

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Note: We are creating policies that allow anon access for simplicity since Netlify functions or frontend will access this,
-- but typically we'd use service role key in Netlify functions to bypass RLS, or setup properly.
-- Allowing all operations for authenticated/anon keys for the sake of the Netlify functions passing through anon.
CREATE POLICY "Allow all operations for anon" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.admins FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.fees FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.bus_pass FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON public.notices FOR ALL USING (true);
