
-- Create or replace function to get all scraped listings for a specific car
CREATE OR REPLACE FUNCTION public.get_scraped_listings_for_car(car_id uuid)
 RETURNS TABLE(id uuid, tracked_car_id uuid, dealer_name text, url text, title text, price numeric, mileage integer, year integer, color text, location text, lat double precision, lng double precision, is_cheapest boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY 
  SELECT 
    s.id,
    s.tracked_car_id,
    s.dealer_name,
    s.url,
    s.title,
    s.price::numeric, 
    s.mileage,
    s.year,
    s.color,
    s.location,
    s.lat,
    s.lng,
    s.is_cheapest,
    s.created_at
  FROM scraped_vehicle_listings s
  WHERE s.tracked_car_id = car_id
  ORDER BY s.price ASC, s.mileage ASC; -- Sort by price, then by mileage
END;
$function$;

-- Create RPC functions needed for organization permissions
CREATE OR REPLACE FUNCTION public.create_user_is_org_member_function()
RETURNS void AS $$
BEGIN
  -- Create a security definer function to check organization membership
  CREATE OR REPLACE FUNCTION public.user_is_org_member(org_id uuid)
  RETURNS boolean AS $inner$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM public.organization_members
      WHERE 
        organization_id = org_id AND 
        user_id = auth.uid()
    );
  END;
  $inner$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset organization RLS policies
CREATE OR REPLACE FUNCTION public.reset_organization_rls_policies()
RETURNS void AS $$
BEGIN
  -- Reset/drop any problematic RLS policies for the organization tables
  DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;
  DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.organization_members;
  DROP POLICY IF EXISTS "Users can update their own memberships" ON public.organization_members;
  DROP POLICY IF EXISTS "Users can delete their own memberships" ON public.organization_members;
  
  DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
  DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Users can update organizations they are members of" ON public.organizations;
  DROP POLICY IF EXISTS "Users can delete organizations they are members of" ON public.organizations;

  -- Enable RLS on both tables
  ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
  
  -- Create safe RLS policies for organization_members table
  CREATE POLICY "Users can view their own memberships" 
    ON public.organization_members 
    FOR SELECT 
    USING (user_id = auth.uid());

  CREATE POLICY "Users can insert their own memberships" 
    ON public.organization_members 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

  CREATE POLICY "Users can update their own memberships" 
    ON public.organization_members 
    FOR UPDATE 
    USING (user_id = auth.uid());

  CREATE POLICY "Users can delete their own memberships" 
    ON public.organization_members 
    FOR DELETE 
    USING (user_id = auth.uid());

  -- Create safe RLS policies for organizations table
  CREATE POLICY "Users can view organizations they are members of" 
    ON public.organizations 
    FOR SELECT 
    USING (public.user_is_org_member(id));

  CREATE POLICY "Users can insert organizations" 
    ON public.organizations 
    FOR INSERT 
    WITH CHECK (true);

  CREATE POLICY "Users can update organizations they are members of" 
    ON public.organizations 
    FOR UPDATE 
    USING (public.user_is_org_member(id));

  CREATE POLICY "Users can delete organizations they are members of" 
    ON public.organizations 
    FOR DELETE 
    USING (public.user_is_org_member(id));
END;
$$ LANGUAGE plpgsql;

-- Create a function to delete a car and all its associated listings
CREATE OR REPLACE FUNCTION public.delete_car_completely(car_id uuid)
RETURNS boolean AS $$
BEGIN
  -- First delete all associated scraped listings
  DELETE FROM scraped_vehicle_listings
  WHERE tracked_car_id = car_id;
  
  -- Then delete the car itself
  DELETE FROM tracked_urls
  WHERE id = car_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get organization IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid uuid)
RETURNS uuid[] AS $$
DECLARE
  org_ids uuid[];
BEGIN
  SELECT array_agg(organization_id) INTO org_ids
  FROM organization_members
  WHERE user_id = user_uuid;
  
  RETURN org_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
