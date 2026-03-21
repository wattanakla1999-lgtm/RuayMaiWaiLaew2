const { Client } = require('pg');

async function testConnection(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`[${name}] ✅ Connected successfully!`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`[${name}] ❌ Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  const ref = 'gqgjnqtdnjhecpjzryrv';
  const pass = 'w@ttana2542KLA'.replace('@', '%40');

  const urls = [
    // 1. Direct with postgres user
    { name: 'Direct postgres', url: `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres` },
    // 2. Direct with postgres.ref user
    { name: 'Direct postgres.ref', url: `postgresql://postgres.${ref}:${pass}@db.${ref}.supabase.co:5432/postgres` },
    // 3. Pooler 6543 with postgres user (likely wrong)
    { name: 'Pooler 6543 postgres', url: `postgresql://postgres:${pass}@db.${ref}.supabase.co:6543/postgres` },
    // 4. Pooler 6543 with postgres.ref user
    { name: 'Pooler 6543 postgres.ref', url: `postgresql://postgres.${ref}:${pass}@db.${ref}.supabase.co:6543/postgres` },
    // 5. ap-southeast-1 pooler 6543 postgres.ref
    { name: 'ap-se-1 pooler', url: `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` }
  ];

  for (const t of urls) {
     await testConnection(t.url, t.name);
  }
}

main();
