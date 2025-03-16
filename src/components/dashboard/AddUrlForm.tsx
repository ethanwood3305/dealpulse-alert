
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface AddUrlFormProps {
  onSubmit: (values: z.infer<typeof urlSchema>) => Promise<void>;
  isAddingUrl: boolean;
  canAddMoreUrls: boolean;
}

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(5, "URL must be at least 5 characters")
});

export const AddUrlForm = ({ onSubmit, isAddingUrl, canAddMoreUrls }: AddUrlFormProps) => {
  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: ""
    }
  });

  return (
    <Card className="mb-10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Add a URL to Track</CardTitle>
          <CardDescription>Enter a competitor's product URL to monitor</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="add-url-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
            <FormField 
              control={form.control} 
              name="url" 
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Product URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/product" 
                      {...field} 
                      disabled={isAddingUrl || !canAddMoreUrls} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the full URL of the product you want to track
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} 
            />
            <Button type="submit" className="self-end" disabled={isAddingUrl || !canAddMoreUrls}>
              {isAddingUrl ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>Add URL</>
              )}
            </Button>
          </form>
        </Form>
        {!canAddMoreUrls && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
            <p className="text-sm">
              You've reached your URL tracking limit. Please remove some URLs or upgrade your plan to add more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
