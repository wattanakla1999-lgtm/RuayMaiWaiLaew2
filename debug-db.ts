import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function debug() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Checking StationFuel...");
  const { data, error } = await supabase
    .from('StationFuel')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error("Error fetching fuels:", error);
  } else {
    console.log("Found fuels (first 10):", data);
  }
  
  console.log("Checking Station...");
  const { data: stations, error: sError } = await supabase
    .from('Station')
    .select('id, name')
    .limit(5);
    
  console.log("Stations (first 5):", stations);
}

debug();
