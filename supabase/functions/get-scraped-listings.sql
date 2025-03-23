
CREATE OR REPLACE FUNCTION public.get_scraped_listings_for_car(car_id uuid)
 RETURNS TABLE(id uuid, tracked_car_id uuid, dealer_name text, url text, title text, price numeric, mileage integer, year integer, color text, location text, lat numeric, lng numeric, is_cheapest boolean, created_at timestamp with time zone)
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
    s.price::numeric, -- Cast integer to numeric
    s.mileage,
    s.year,
    s.color,
    s.location,
    s.lat,
    s.lng,
    s.is_cheapest,
    s.created_at
  FROM scraped_vehicle_listings s
  WHERE s.tracked_car_id = car_id;
END;
$function$;
