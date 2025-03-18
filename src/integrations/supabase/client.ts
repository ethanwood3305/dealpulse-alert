
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqtbybcllutbxyobzjxz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxdGJ5YmNsbHV0Ynh5b2J6anh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYwNjQ0NjEsImV4cCI6MjAzMTY0MDQ2MX0.2fKMcgZvFm77HBLLAgQlv_QmmdnXy31ynQ-0FXpS1zU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapbox token
export const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGVhbHB1bHNlIiwiYSI6ImNsbXg1cHdrOTAxZWwycW50bmNjNnF0aW4ifQ.GSIBL15yI1TQ_ElD3Ll0YQ';
