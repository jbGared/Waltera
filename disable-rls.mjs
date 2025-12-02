#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA0NTc3OSwiZXhwIjoyMDczNjIxNzc5fQ.2_3iBqTlgwrTmeDLPU8NscvfLZIsCJ7aZnY8ltof5_4';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔧 Désactivation du RLS via API Supabase\n');

async function disableRLS() {
  try {
    // Exécuter le SQL via l'API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE zones_sante DISABLE ROW LEVEL SECURITY;
        ALTER TABLE tarifs_sante DISABLE ROW LEVEL SECURITY;
      `
    });

    if (error) {
      console.log('⚠️  La fonction RPC n\'existe pas, essayons autrement...\n');

      // Alternative: Utiliser le SQL Editor endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          query: 'ALTER TABLE zones_sante DISABLE ROW LEVEL SECURITY; ALTER TABLE tarifs_sante DISABLE ROW LEVEL SECURITY;'
        })
      });

      console.log('Response status:', response.status);
      const result = await response.text();
      console.log('Result:', result);
    } else {
      console.log('✅ RLS désactivé avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📝 VEUILLEZ EXÉCUTER CE SQL DANS LE DASHBOARD SUPABASE:');
    console.log('----------------------------------------------------');
    console.log('ALTER TABLE zones_sante DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE tarifs_sante DISABLE ROW LEVEL SECURITY;');
    console.log('----------------------------------------------------');
  }
}

disableRLS();
