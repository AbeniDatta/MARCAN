-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (company/user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  business_number TEXT,
  website TEXT,
  phone TEXT,
  street_address TEXT,
  city TEXT,
  province TEXT,
  about_us TEXT,
  logo_url TEXT,
  capabilities TEXT[],
  materials TEXT[],
  certifications TEXT[],
  primary_intent TEXT CHECK (primary_intent IN ('buy', 'sell')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings table (supplier marketplace listings)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT,
  category TEXT,
  badge TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist requests table (buyer requests/RFQs)
CREATE TABLE IF NOT EXISTS wishlist_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_profile_id ON listings(profile_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_profile_id ON wishlist_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist_requests(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_updated_at
  BEFORE UPDATE ON wishlist_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_requests ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your security requirements)
-- Allow anyone to read profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Adjust this to check auth.uid() when using Supabase Auth

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (true); -- Adjust this to check auth.uid() when using Supabase Auth

-- Allow anyone to read listings
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

-- Allow authenticated users to create listings
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (true); -- Adjust this to check auth.uid() when using Supabase Auth

-- Allow anyone to read wishlist requests
CREATE POLICY "Wishlist requests are viewable by everyone"
  ON wishlist_requests FOR SELECT
  USING (true);

-- Allow authenticated users to create wishlist requests
CREATE POLICY "Authenticated users can create wishlist requests"
  ON wishlist_requests FOR INSERT
  WITH CHECK (true); -- Adjust this to check auth.uid() when using Supabase Auth
