import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function debug() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Checking StationFuel columns...");
  const { data, error } = await supabase
    .from('StationFuel')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error:", error);
  } else if (data && data[0]) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("Sample row:", data[0]);
  } else {
    console.log("No data in StationFuel to check columns.");
  }
}

debug();
