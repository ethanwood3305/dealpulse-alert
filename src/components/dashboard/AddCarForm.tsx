import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const carSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
});

interface AddCarFormProps {
  onSubmit: (values: z.infer<typeof carSchema>) => Promise<void>;
  isAddingCar: boolean;
  canAddMoreCars: boolean;
}

const carBrandsData = {
  "Audi": [
    "A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", 
    "e-tron GT", "e-tron", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RSQ8"
  ],
  "BMW": [
    "1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7", "iX", "i3", "i4", "i5", "i7", "iX1", "iX3", 
    "Z4", "M2", "M3", "M4", "M5", "M8", "XM"
  ],
  "Chevrolet": [
    "Spark", "Aveo", "Cruze", "Malibu", "Impala", "Camaro", "Corvette", "Trax", "Equinox", 
    "Blazer", "Traverse", "Tahoe", "Suburban", "Colorado", "Silverado", "Bolt EV", "Bolt EUV"
  ],
  "Citroen": [
    "C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "SpaceTourer",
    "e-C4", "e-Berlingo", "e-SpaceTourer"
  ],
  "Dodge": [
    "Challenger", "Charger", "Durango", "Hornet"
  ],
  "Fiat": [
    "500", "500e", "Panda", "Tipo", "500X", "500L"
  ],
  "Ford": [
    "Fiesta", "Focus", "Mustang", "Mustang Mach-E", "Puma", "Kuga", "EcoSport", "Explorer", 
    "Edge", "Ranger", "F-150", "Transit", "Bronco", "Maverick", "GT", "Escape", "Expedition",
    "Ranger Raptor", "F-150 Raptor", "Bronco Raptor"
  ],
  "Honda": [
    "Jazz", "Civic", "Accord", "HR-V", "CR-V", "e", "ZR-V", "NSX", "Type R"
  ],
  "Hyundai": [
    "i10", "i20", "i30", "Bayon", "Kona", "Kona Electric", "Tucson", "Santa Fe", "IONIQ 5", 
    "IONIQ 6", "NEXO", "Staria"
  ],
  "Jaguar": [
    "XE", "XF", "F-PACE", "E-PACE", "I-PACE", "F-TYPE"
  ],
  "Jeep": [
    "Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Avenger", "Wagoneer"
  ],
  "Kia": [
    "Picanto", "Rio", "Ceed", "XCeed", "Proceed", "Niro", "Sportage", "Sorento", "Stonic", 
    "EV6", "EV9", "Soul", "Stinger", "Carnival"
  ],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", 
    "Range Rover Velar", "Range Rover Evoque"
  ],
  "Lexus": [
    "UX", "NX", "RX", "LX", "GX", "IS", "ES", "LS", "LC", "RZ", "RC", "LFA"
  ],
  "Mazda": [
    "2", "3", "6", "MX-5", "MX-30", "CX-3", "CX-30", "CX-5", "CX-60", "CX-90"
  ],
  "Mercedes-Benz": [
    "A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", 
    "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV",
    "AMG GT", "SL", "Maybach S-Class", "Maybach GLS"
  ],
  "MINI": [
    "MINI Electric", "MINI 3-door", "MINI 5-door", "MINI Clubman", "MINI Countryman", "MINI Convertible",
    "John Cooper Works"
  ],
  "Mitsubishi": [
    "Mirage", "ASX", "Eclipse Cross", "Outlander", "Outlander PHEV", "L200"
  ],
  "Nissan": [
    "Micra", "Juke", "Qashqai", "X-Trail", "Ariya", "Leaf", "GT-R", "Z", "Navara",
    "NISMO GT-R", "Townstar", "Primastar", "Interstar"
  ],
  "Peugeot": [
    "108", "208", "308", "408", "508", "2008", "3008", "5008", "Rifter", "Traveller",
    "e-208", "e-308", "e-2008", "e-3008", "e-5008", "e-Rifter", "e-Traveller", "Partner", "Expert", "Boxer"
  ],
  "Porsche": [
    "911", "718 Cayman", "718 Boxster", "Panamera", "Taycan", "Macan", "Cayenne", "Macan Electric"
  ],
  "Renault": [
    "Clio", "Captur", "Megane E-TECH", "Austral", "Arkana", "Espace", "Kangoo", "Trafic", "Master",
    "Zoe", "Twingo Electric", "Scenic E-Tech"
  ],
  "SEAT": [
    "Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Mii Electric", "Cupra Born", "Cupra Leon", 
    "Cupra Formentor", "Cupra Ateca", "Cupra Tavascan"
  ],
  "Skoda": [
    "Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq iV", "Elroq"
  ],
  "Subaru": [
    "Impreza", "XV", "Forester", "Outback", "Solterra", "WRX", "BRZ", "Levorg", "Ascent"
  ],
  "Suzuki": [
    "Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Across", "Swace", "Grand Vitara"
  ],
  "Tesla": [
    "Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Roadster"
  ],
  "Toyota": [
    "Aygo X", "Yaris", "Yaris Cross", "Corolla", "C-HR", "RAV4", "Highlander", "Land Cruiser", 
    "Camry", "GR86", "GR Supra", "GR Yaris", "GR Corolla", "bZ4X", "Mirai", "Prius", "Proace",
    "Hilux", "Crown"
  ],
  "Volkswagen": [
    "up!", "Polo", "Golf", "Golf GTI", "Golf R", "T-Cross", "T-Roc", "Taigo", "Tiguan", 
    "Tiguan Allspace", "Passat", "Arteon", "Touran", "Touareg", "Sharan", "ID.3", "ID.4", 
    "ID.5", "ID.7", "ID. Buzz", "Caddy", "Transporter", "Crafter"
  ],
  "Volvo": [
    "XC40", "XC60", "XC90", "S60", "S90", "V60", "V90", "C40 Recharge", "EX30", "EX90"
  ]
};

const defaultEngineTypesMap = {
  "Ford": {
    "Fiesta": [
      "EcoBoost 1.0 100PS", 
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.0 155PS", 
      "EcoBoost 1.5 200PS"
    ],
    "Focus": [
      "EcoBoost 1.0 125PS", 
      "EcoBoost 1.5 150PS", 
      "EcoBoost 1.5 182PS", 
      "EcoBlue 1.5 95PS", 
      "EcoBlue 1.5 120PS"
    ],
    "Mustang": [
      "2.3L EcoBoost 310HP",
      "5.0L V8 460HP",
      "5.2L V8 760HP Shelby GT500"
    ],
    "Mustang Mach-E": [
      "Standard Range RWD 269HP",
      "Extended Range RWD 294HP",
      "Standard Range AWD 269HP",
      "Extended Range AWD 346HP",
      "GT Performance 480HP"
    ],
    "Puma": [
      "EcoBoost 1.0 125PS",
      "EcoBoost 1.0 155PS",
      "EcoBoost Hybrid 1.0 125PS",
      "EcoBoost Hybrid 1.0 155PS"
    ],
    "Kuga": [
      "EcoBlue 1.5 120PS",
      "EcoBlue 2.0 150PS",
      "EcoBlue 2.0 190PS",
      "EcoBlue Hybrid 2.0 150PS",
      "Plug-in Hybrid 2.5 225PS"
    ],
    "Explorer": [
      "Plug-in Hybrid 3.0 V6 457HP"
    ],
    "Ranger": [
      "EcoBlue 2.0 Single-Turbo 170PS",
      "EcoBlue 2.0 Bi-Turbo 213PS",
      "V6 3.0 Diesel 240PS",
      "2.3L EcoBoost Petrol 270PS"
    ],
    "Ranger Raptor": [
      "V6 3.0 Petrol EcoBoost 288PS"
    ],
    "F-150": [
      "3.3L V6 290HP",
      "2.7L EcoBoost V6 325HP",
      "5.0L V8 400HP",
      "3.5L EcoBoost V6 400HP",
      "PowerBoost Hybrid 430HP",
      "3.5L EcoBoost V6 450HP Raptor",
      "5.2L Supercharged V8 700HP Raptor R"
    ],
    "Bronco": [
      "2.3L EcoBoost 270HP",
      "2.7L EcoBoost V6 310HP",
      "3.0L EcoBoost V6 418HP Raptor"
    ]
  },
  "BMW": {
    "1 Series": [
      "118i 1.5L 136HP",
      "120i 2.0L 178HP",
      "M135i 2.0L 306HP",
      "116d 2.0L 116HP",
      "118d 2.0L 150HP",
      "120d 2.0L 190HP"
    ],
    "3 Series": [
      "318i 2.0L 156HP", 
      "320i 2.0L 184HP", 
      "330i 2.0L 258HP",
      "M340i 3.0L 374HP",
      "316d 2.0L 122HP",
      "318d 2.0L 150HP", 
      "320d 2.0L 190HP", 
      "330d 3.0L 286HP",
      "M3 3.0L 480HP",
      "M3 Competition 3.0L 510HP",
      "330e Plug-in Hybrid 292HP"
    ],
    "5 Series": [
      "520i 2.0L 184HP",
      "530i 2.0L 252HP",
      "540i 3.0L 340HP",
      "520d 2.0L 190HP",
      "530d 3.0L 286HP",
      "M550i 4.4L 530HP",
      "M5 4.4L 600HP",
      "M5 Competition 4.4L 625HP",
      "530e Plug-in Hybrid 292HP",
      "545e Plug-in Hybrid 394HP",
      "i5 eDrive40 340HP Electric",
      "i5 M60 xDrive 601HP Electric"
    ],
    "i4": [
      "eDrive35 286HP",
      "eDrive40 340HP",
      "M50 544HP"
    ],
    "iX": [
      "xDrive40 326HP",
      "xDrive50 523HP",
      "M60 619HP"
    ],
    "X5": [
      "xDrive30d 3.0L 286HP",
      "xDrive40d 3.0L 340HP",
      "xDrive40i 3.0L 340HP",
      "M50i 4.4L 530HP",
      "X5 M 4.4L 600HP",
      "X5 M Competition 4.4L 625HP",
      "xDrive45e Plug-in Hybrid 394HP"
    ]
  },
  "Audi": {
    "A1": [
      "25 TFSI 1.0L 95HP",
      "30 TFSI 1.0L 110HP",
      "35 TFSI 1.5L 150HP",
      "40 TFSI 2.0L 200HP"
    ],
    "A3": [
      "30 TFSI 1.0L 110HP",
      "35 TFSI 1.5L 150HP",
      "40 TFSI 2.0L 190HP",
      "S3 2.0L 310HP",
      "RS3 2.5L 400HP",
      "30 TDI 2.0L 116HP",
      "35 TDI 2.0L 150HP"
    ],
    "A4": [
      "35 TFSI 2.0L 150HP",
      "40 TFSI 2.0L 204HP",
      "45 TFSI 2.0L 265HP",
      "S4 3.0L 341HP",
      "RS4 2.9L 450HP",
      "30 TDI 2.0L 136HP",
      "35 TDI 2.0L 163HP",
      "40 TDI 2.0L 204HP",
      "50 TDI 3.0L 286HP"
    ],
    "e-tron GT": [
      "e-tron GT quattro 476HP",
      "RS e-tron GT 598HP"
    ],
    "Q4 e-tron": [
      "35 e-tron 170HP",
      "40 e-tron 204HP",
      "45 e-tron quattro 265HP",
      "50 e-tron quattro 299HP"
    ]
  },
  "Tesla": {
    "Model 3": [
      "Standard Range RWD 283HP",
      "Long Range AWD 346HP",
      "Performance AWD 455HP"
    ],
    "Model S": [
      "Dual Motor AWD 670HP",
      "Plaid 1,020HP"
    ],
    "Model X": [
      "Dual Motor AWD 670HP",
      "Plaid 1,020HP"
    ],
    "Model Y": [
      "Standard Range RWD 283HP",
      "Long Range AWD 384HP",
      "Performance AWD 455HP"
    ],
    "Cybertruck": [
      "RWD 600HP",
      "Dual Motor AWD 800HP",
      "Cyberbeast 845HP"
    ]
  },
  "Volkswagen": {
    "Golf": [
      "1.0 TSI 110HP",
      "1.5 TSI 130HP",
      "1.5 TSI 150HP",
      "1.5 eTSI Mild Hybrid 150HP",
      "2.0 TSI 245HP GTI",
      "2.0 TSI 320HP R",
      "2.0 TDI 115HP",
      "2.0 TDI 150HP",
      "2.0 TDI 200HP GTD",
      "1.4 eHybrid 204HP",
      "1.4 GTE 245HP"
    ],
    "ID.3": [
      "Pro 145HP",
      "Pro 204HP",
      "Pro S 204HP"
    ],
    "ID.4": [
      "Pure 170HP",
      "Pro 204HP",
      "Pro 4MOTION 265HP",
      "GTX 299HP"
    ],
    "Tiguan": [
      "1.5 TSI 130HP",
      "1.5 TSI 150HP",
      "1.5 eTSI Mild Hybrid 150HP",
      "2.0 TSI 190HP",
      "2.0 TSI 245HP",
      "2.0 TSI 320HP R",
      "2.0 TDI 150HP",
      "2.0 TDI 200HP",
      "eHybrid 245HP"
    ]
  },
  "Mercedes-Benz": {
    "A-Class": [
      "A180 1.3L 136HP",
      "A200 1.3L 163HP",
      "A250 2.0L 224HP",
      "A35 AMG 2.0L 306HP",
      "A45 AMG 2.0L 387HP",
      "A45 S AMG 2.0L 421HP",
      "A180d 2.0L 116HP",
      "A200d 2.0L 150HP",
      "A220d 2.0L 190HP"
    ],
    "C-Class": [
      "C180 1.5L 170HP",
      "C200 1.5L 204HP",
      "C300 2.0L 258HP",
      "C43 AMG 2.0L 402HP",
      "C63 AMG 2.0L Hybrid 671HP",
      "C200d 2.0L 163HP",
      "C220d 2.0L 200HP",
      "C300d 2.0L 265HP",
      "C300e Plug-in Hybrid 313HP"
    ],
    "EQS": [
      "EQS 450+ 333HP",
      "EQS 500 4MATIC 443HP",
      "EQS 580 4MATIC 523HP",
      "AMG EQS 53 4MATIC+ 658HP"
    ]
  },
  "Honda": {
    "Civic": [
      "1.0 VTEC Turbo 126HP",
      "1.5 VTEC Turbo 182HP",
      "2.0 VTEC Turbo 329HP Type R",
      "e:HEV Hybrid 143HP"
    ],
    "CR-V": [
      "2.0 i-MMD Hybrid e:HEV 184HP",
      "2.0 i-MMD PHEV e:PHEV 184HP"
    ],
    "HR-V": [
      "1.5 i-MMD Hybrid e:HEV 131HP"
    ],
    "ZR-V": [
      "2.0 i-MMD Hybrid e:HEV 184HP"
    ]
  },
  "Land Rover": {
    "Defender": [
      "P300 Ingenium Petrol 300HP",
      "P400 Ingenium Petrol 400HP",
      "P400e PHEV 404HP",
      "P525 V8 Petrol 525HP",
      "D200 Ingenium Diesel 200HP",
      "D240 Ingenium Diesel 240HP",
      "D300 Ingenium Diesel 300HP",
      "D350 Ingenium Diesel 350HP"
    ],
    "Range Rover": [
      "P400 Ingenium Petrol 400HP",
      "P440e PHEV 440HP",
      "P530 V8 Petrol 530HP",
      "P615 V8 Petrol SV 615HP",
      "D250 Ingenium Diesel 250HP",
      "D300 Ingenium Diesel 300HP",
      "D350 Ingenium Diesel 350HP"
    ]
  },
  "Toyota": {
    "Yaris": [
      "1.0L Petrol 72HP",
      "1.5L Petrol 125HP",
      "1.5L Hybrid 116HP"
    ],
    "Corolla": [
      "1.8L Hybrid 140HP",
      "2.0L Hybrid 196HP"
    ],
    "RAV4": [
      "2.5L Hybrid 218HP",
      "2.5L Plug-in Hybrid 306HP"
    ],
    "GR Yaris": [
      "1.6L Turbo 261HP",
      "1.6L Turbo 300HP"
    ],
    "GR86": [
      "2.4L Boxer 234HP"
    ],
    "Supra": [
      "2.0L Turbo 258HP",
      "3.0L Turbo 340HP"
    ]
  }
};

const defaultCommonEngineTypes = [
  "Petrol",
  "Diesel",
  "Mild Hybrid",
  "Hybrid",
  "Plug-in Hybrid",
  "Electric"
];

export const AddCarForm = ({ onSubmit, isAddingCar, canAddMoreCars }: AddCarFormProps) => {
  const [brands, setBrands] = useState<{id: string, name: string}[]>([]);
  const [models, setModels] = useState<{id: string, name: string}[]>([]);
  const [engineTypes, setEngineTypes] = useState<{id: string, name: string, fuel_type: string, capacity?: string, power?: string}[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingEngineTypes, setIsLoadingEngineTypes] = useState(false);
  
  const form = useForm<z.infer<typeof carSchema>>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      engineType: "",
      mileage: "",
      year: "",
      color: ""
    }
  });

  const selectedBrand = form.watch("brand");
  const selectedModel = form.watch("model");

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoadingBrands(true);
      try {
        console.log("Fetching car brands...");
        const { data, error } = await supabase
          .from('car_brands')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Found brands from database:", data.length);
          setBrands(data);
        } else {
          console.log("No brands in database, using hardcoded list");
          const defaultBrands = Object.keys(carBrandsData);
          setBrands(defaultBrands.map(name => ({ id: name, name })));
        }
      } catch (error) {
        console.error('Error fetching car brands:', error);
        toast({
          title: "Could not load car brands",
          description: "We couldn't retrieve the list of car brands. Using default list instead.",
          variant: "destructive"
        });
        
        const defaultBrands = Object.keys(carBrandsData);
        setBrands(defaultBrands.map(name => ({ id: name, name })));
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        console.log(`Fetching models for brand: ${selectedBrand}`);
        
        const selectedBrandObj = brands.find(b => b.name === selectedBrand);
        console.log("Selected brand object:", selectedBrandObj);
        
        let databaseModels = [];
        if (selectedBrandObj?.id) {
          const { data, error } = await supabase
            .from('car_models')
            .select('id, name')
            .eq('brand_id', selectedBrandObj.id)
            .order('name');
          
          if (error) {
            console.error("Database error fetching models:", error);
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} models for ${selectedBrand} in database`);
            databaseModels = data;
          }
        }
        
        if (databaseModels.length > 0) {
          setModels(databaseModels);
        } else {
          console.log(`No models in database for ${selectedBrand}, using hardcoded data`);
          
          const brandModels = carBrandsData[selectedBrand as keyof typeof carBrandsData] || [];
          console.log(`Found ${brandModels.length} models for ${selectedBrand} in hardcoded data`);
          
          if (brandModels.length > 0) {
            setModels(brandModels.map(name => ({ id: name, name })));
          } else {
            const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
            setModels(defaultModels.map(name => ({ id: name, name })));
          }
        }
      } catch (error) {
        console.error('Error fetching car models:', error);
        toast({
          title: "Could not load car models",
          description: "We couldn't retrieve the models for the selected brand. Using default list instead.",
          variant: "destructive"
        });
        
        const defaultModels = ["Standard", "Deluxe", "Sport", "Limited", "Other"];
        setModels(defaultModels.map(name => ({ id: name, name })));
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
    form.setValue("engineType", "");
    form.setValue("model", "");
  }, [selectedBrand, brands, form]);

  useEffect(() => {
    if (!selectedModel || !selectedBrand) {
      setEngineTypes([]);
      return;
    }

    const fetchEngineTypes = async () => {
      setIsLoadingEngineTypes(true);
      try {
        console.log(`Fetching engine types for ${selectedBrand} ${selectedModel}`);
        
        const selectedModelObj = models.find(m => m.name === selectedModel);
        console.log("Selected model object:", selectedModelObj);
        
        let databaseEngineTypes = [];
        if (selectedModelObj?.id) {
          const { data, error } = await supabase
            .from('engine_types')
            .select('id, name, fuel_type, capacity, power')
            .eq('model_id', selectedModelObj.id)
            .order('name');
          
          if (error) {
            console.error('Database error fetching engine types:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} engine types in database`);
            databaseEngineTypes = data;
          }
        }
        
        if (databaseEngineTypes.length > 0) {
          setEngineTypes(databaseEngineTypes);
        } else {
          let engineTypesList: string[] = [];
          
          if (defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap] && 
              defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap][selectedModel]) {
            engineTypesList = defaultEngineTypesMap[selectedBrand as keyof typeof defaultEngineTypesMap][selectedModel];
            console.log(`Using specific engine types for ${selectedBrand} ${selectedModel}, found ${engineTypesList.length}`);
          } else {
            engineTypesList = defaultCommonEngineTypes;
            console.log(`Using generic engine types for ${selectedBrand} ${selectedModel}`);
          }
          
          setEngineTypes(engineTypesList.map(name => ({
            id: name,
            name,
            fuel_type: determineFuelType(name)
          })));
        }
      } catch (error) {
        console.error('Error fetching engine types:', error);
        toast({
          title: "Could not load engine types",
          description: "Using default engine types instead.",
          variant: "destructive"
        });
        
        setEngineTypes(defaultCommonEngineTypes.map(name => ({
          id: name,
          name,
          fuel_type: determineFuelType(name)
        })));
      } finally {
        setIsLoadingEngineTypes(false);
      }
    };

    fetchEngineTypes();
  }, [selectedModel, selectedBrand, models]);

  const determineFuelType = (engineName: string): string => {
    const lowerName = engineName.toLowerCase();
    if (lowerName.includes('diesel') || lowerName.includes('tdi') || lowerName.match(/\bd\d/) || lowerName.includes('cdi')) return 'Diesel';
    if (lowerName.includes('electric') || lowerName.includes('ev') || lowerName.includes('e-tron') || lowerName.includes('eqs') || lowerName.includes('taycan') || lowerName.includes('id.')) return 'Electric';
    if (lowerName.includes('hybrid') && lowerName.includes('plug') || lowerName.includes('phev') || lowerName.includes('e:phev')) return 'Plug-in Hybrid';
    if (lowerName.includes('hybrid') || lowerName.includes('e:hev') || lowerName.includes('e-power')) return 'Hybrid';
    if (lowerName.includes('mild hybrid') || lowerName.includes('mhev') || lowerName.includes('etsi')) return 'Mild Hybrid';
    return 'Petrol';
  };

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add a Vehicle to Track</CardTitle>
          <CardDescription>Enter vehicle details to monitor</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="add-car-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField 
                control={form.control} 
                name="brand" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select 
                      disabled={isAddingCar || !canAddMoreCars || isLoadingBrands}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("model", "");
                        form.setValue("engineType", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingBrands ? "Loading brands..." : "Select brand"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingBrands ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : (
                          brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="model" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select 
                      disabled={!selectedBrand || isAddingCar || !canAddMoreCars || isLoadingModels}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("engineType", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingModels ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : (
                          models.map(model => (
                            <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="engineType" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engine Type</FormLabel>
                    <Select 
                      disabled={!selectedModel || isAddingCar || !canAddMoreCars || isLoadingEngineTypes}
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingEngineTypes ? "Loading engines..." : "Select engine type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingEngineTypes ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                            Loading...
                          </SelectItem>
                        ) : engineTypes.length > 0 ? (
                          engineTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name} 
                              {type.fuel_type && ` (${type.fuel_type})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="standard">Standard</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField 
                control={form.control} 
                name="mileage" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 45000" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="year" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 2022" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />

              <FormField 
                control={form.control} 
                name="color" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Silver" 
                        {...field} 
                        disabled={isAddingCar || !canAddMoreCars} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isAddingCar || !canAddMoreCars}>
              {isAddingCar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add Vehicle</>
              )}
            </Button>
          </form>
        </Form>
        
        {!canAddMoreCars && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
            <p className="text-sm">
              You've reached your vehicle tracking limit. Please remove some vehicles or upgrade your plan to add more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
