
import * as z from "zod";

export const carSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  engineType: z.string().min(1, "Engine type is required"),
  mileage: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  price: z.string().optional(),
});

export type CarFormValues = z.infer<typeof carSchema>;
