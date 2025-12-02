#!/usr/bin/env node

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3NzksImV4cCI6MjA3MzYyMTc3OX0.jnVjgixHQOHOakT0zEMKJBFDQU9WEAbJHgQ6w6UD0-U';

console.log('🧪 Test API REST Supabase direct\n');

async function testAPI() {
  const url = `${SUPABASE_URL}/rest/v1/zones_sante?select=*&type_zone=eq.TNS&departement=eq.27`;

  console.log('URL:', url);
  console.log('\nHeaders envoyés:');
  console.log('  - apikey: présente');
  console.log('  - Authorization: Bearer token');
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nDonnées reçues:', data);

    if (Array.isArray(data) && data.length > 0) {
      console.log('\n✅ SUCCÈS: Zone trouvée pour département 27 (TNS)');
      console.log('   Code zone:', data[0].code_zone);
    } else if (Array.isArray(data) && data.length === 0) {
      console.log('\n⚠️  Aucune donnée retournée (tableau vide)');
    } else {
      console.log('\n❌ Format inattendu:', data);
    }
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testAPI();
