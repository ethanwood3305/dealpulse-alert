
-- Create a function to get scraped listings for a car
CREATE OR REPLACE FUNCTION get_scraped_listings_for_car(car_id UUID)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY 
  SELECT json_build_object(
    'id', id,
    'tracked_car_id', tracked_car_id,
    'dealer_name', dealer_name,
    'url', url,
    'title', title,
    'price', price,
    'mileage', mileage,
    'year', year,
    'color', color,
    'location', location,
    'lat', lat,
    'lng', lng,
    'is_cheapest', is_cheapest,
    'created_at', created_at
  )
  FROM scraped_vehicle_listings
  WHERE tracked_car_id = car_id;
END;
$$ LANGUAGE plpgsql;
