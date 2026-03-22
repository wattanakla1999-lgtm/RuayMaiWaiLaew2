import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function debug() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const targetId = "9c7e3c3d-1b8a-4dd3-abf3-b9644e6edd14";
  
  console.log(`Checking StationFuel for ${targetId}...`);
  const { data, error } = await supabase
    .from('StationFuel')
    .select('*')
    .eq('stationId', targetId);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Fuels for target:", data);
  }

  const { data: s } = await supabase.from('Station').select('*').eq('id', targetId).single();
  console.log("Station data:", s);
}

debug();
