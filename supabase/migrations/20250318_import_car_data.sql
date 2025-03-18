
-- Update populate_car_data function to include more brands and models

CREATE OR REPLACE FUNCTION public.populate_car_data()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  brand_id UUID;
  model_id UUID;
BEGIN
  -- Add all major brands
  INSERT INTO public.car_brands (name) VALUES
    ('Acura'), ('Alfa Romeo'), ('Aston Martin'), ('Audi'), ('Bentley'), 
    ('BMW'), ('Bugatti'), ('Buick'), ('Cadillac'), ('Chevrolet'),
    ('Chrysler'), ('Citroen'), ('Cupra'), ('Dacia'), ('Daewoo'),
    ('Daihatsu'), ('Dodge'), ('Ferrari'), ('Fiat'), ('Ford'),
    ('Genesis'), ('GMC'), ('Honda'), ('Hyundai'), ('Infiniti'),
    ('Jaguar'), ('Jeep'), ('Kia'), ('Koenigsegg'), ('Lamborghini'),
    ('Land Rover'), ('Lexus'), ('Lincoln'), ('Lotus'), ('Lucid'),
    ('Maserati'), ('Mazda'), ('McLaren'), ('Mercedes-Benz'), ('Mercury'),
    ('MG'), ('MINI'), ('Mitsubishi'), ('Nissan'), ('Opel'),
    ('Pagani'), ('Peugeot'), ('Piaggio'), ('Polestar'), ('Pontiac'),
    ('Porsche'), ('Ram'), ('Renault'), ('Rivian'), ('Rolls-Royce'),
    ('Saab'), ('Saturn'), ('SEAT'), ('Skoda'), ('Smart'),
    ('Ssangyong'), ('Subaru'), ('Suzuki'), ('Tesla'), ('Toyota'),
    ('Vauxhall'), ('Volkswagen'), ('Volvo')
  ON CONFLICT (name) DO NOTHING;

  -- Ford Example
  SELECT id INTO brand_id FROM public.car_brands WHERE name = 'Ford';
  
  -- Add Ford models
  INSERT INTO public.car_models (brand_id, name)
  VALUES 
    (brand_id, 'Fiesta'), 
    (brand_id, 'Focus'),
    (brand_id, 'Mustang'),
    (brand_id, 'Mustang Mach-E'),
    (brand_id, 'Puma'),
    (brand_id, 'Kuga'),
    (brand_id, 'Explorer'),
    (brand_id, 'Ranger'),
    (brand_id, 'F-150'),
    (brand_id, 'Bronco'),
    (brand_id, 'Mondeo'),
    (brand_id, 'Galaxy'),
    (brand_id, 'S-Max'),
    (brand_id, 'Edge'),
    (brand_id, 'EcoSport'),
    (brand_id, 'Tourneo Connect'),
    (brand_id, 'Tourneo Custom'),
    (brand_id, 'Transit'),
    (brand_id, 'Transit Connect'),
    (brand_id, 'Transit Custom'),
    (brand_id, 'Ranger Raptor'),
    (brand_id, 'F-150 Raptor'),
    (brand_id, 'GT')
  ON CONFLICT (brand_id, name) DO NOTHING;
  
  -- Add engine types for Ford Fiesta
  SELECT id INTO model_id FROM public.car_models WHERE name = 'Fiesta' AND brand_id = brand_id;
  
  INSERT INTO public.engine_types (model_id, name, fuel_type, capacity, power)
  VALUES
    (model_id, '1.0L EcoBoost 95PS', 'Petrol', '1.0L', '95PS'),
    (model_id, '1.0L EcoBoost 100PS', 'Petrol', '1.0L', '100PS'),
    (model_id, '1.0L EcoBoost 125PS', 'Petrol', '1.0L', '125PS'),
    (model_id, '1.0L EcoBoost 155PS', 'Petrol', '1.0L', '155PS'),
    (model_id, '1.5L EcoBoost 200PS ST', 'Petrol', '1.5L', '200PS'),
    (model_id, '1.5L TDCi 85PS', 'Diesel', '1.5L', '85PS'),
    (model_id, '1.5L TDCi 120PS', 'Diesel', '1.5L', '120PS')
  ON CONFLICT (model_id, name) DO NOTHING;

  -- Add engine types for Ford Focus
  SELECT id INTO model_id FROM public.car_models WHERE name = 'Focus' AND brand_id = brand_id;
  
  INSERT INTO public.engine_types (model_id, name, fuel_type, capacity, power)
  VALUES
    (model_id, '1.0L EcoBoost 100PS', 'Petrol', '1.0L', '100PS'),
    (model_id, '1.0L EcoBoost 125PS', 'Petrol', '1.0L', '125PS'),
    (model_id, '1.5L EcoBoost 150PS', 'Petrol', '1.5L', '150PS'),
    (model_id, '1.5L EcoBoost 182PS', 'Petrol', '1.5L', '182PS'),
    (model_id, '2.3L EcoBoost 280PS ST', 'Petrol', '2.3L', '280PS'),
    (model_id, '2.3L EcoBoost 350PS RS', 'Petrol', '2.3L', '350PS'),
    (model_id, '1.5L EcoBlue 95PS', 'Diesel', '1.5L', '95PS'),
    (model_id, '1.5L EcoBlue 120PS', 'Diesel', '1.5L', '120PS'),
    (model_id, '2.0L EcoBlue 150PS', 'Diesel', '2.0L', '150PS'),
    (model_id, '2.0L EcoBlue 190PS', 'Diesel', '2.0L', '190PS')
  ON CONFLICT (model_id, name) DO NOTHING;

  -- BMW Example
  SELECT id INTO brand_id FROM public.car_brands WHERE name = 'BMW';
  
  -- Add BMW models
  INSERT INTO public.car_models (brand_id, name)
  VALUES 
    (brand_id, '1 Series'), 
    (brand_id, '2 Series'),
    (brand_id, '3 Series'),
    (brand_id, '4 Series'),
    (brand_id, '5 Series'),
    (brand_id, '6 Series'),
    (brand_id, '7 Series'),
    (brand_id, '8 Series'),
    (brand_id, 'X1'),
    (brand_id, 'X2'),
    (brand_id, 'X3'),
    (brand_id, 'X4'),
    (brand_id, 'X5'),
    (brand_id, 'X6'),
    (brand_id, 'X7'),
    (brand_id, 'Z4'),
    (brand_id, 'i3'),
    (brand_id, 'i4'),
    (brand_id, 'i7'),
    (brand_id, 'iX'),
    (brand_id, 'M2'),
    (brand_id, 'M3'),
    (brand_id, 'M4'),
    (brand_id, 'M5'),
    (brand_id, 'M8')
  ON CONFLICT (brand_id, name) DO NOTHING;
  
  -- Add engine types for BMW 3 Series
  SELECT id INTO model_id FROM public.car_models WHERE name = '3 Series' AND brand_id = brand_id;
  
  INSERT INTO public.engine_types (model_id, name, fuel_type, capacity, power)
  VALUES
    (model_id, '318i 1.5L 156HP', 'Petrol', '1.5L', '156HP'),
    (model_id, '320i 2.0L 184HP', 'Petrol', '2.0L', '184HP'),
    (model_id, '330i 2.0L 258HP', 'Petrol', '2.0L', '258HP'),
    (model_id, 'M340i xDrive 3.0L 374HP', 'Petrol', '3.0L', '374HP'),
    (model_id, '316d 2.0L 122HP', 'Diesel', '2.0L', '122HP'),
    (model_id, '318d 2.0L 150HP', 'Diesel', '2.0L', '150HP'),
    (model_id, '320d 2.0L 190HP', 'Diesel', '2.0L', '190HP'),
    (model_id, '330d 3.0L 286HP', 'Diesel', '3.0L', '286HP'),
    (model_id, 'M3 3.0L 480HP', 'Petrol', '3.0L', '480HP'),
    (model_id, 'M3 Competition 3.0L 510HP', 'Petrol', '3.0L', '510HP'),
    (model_id, '330e Plug-in Hybrid 292HP', 'Plug-in Hybrid', '2.0L', '292HP')
  ON CONFLICT (model_id, name) DO NOTHING;
  
  -- More brands and models would be added here...
END;
$$;

-- Run the populate function to seed the database
SELECT public.populate_car_data();
