#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syxsacbciqwrahjdixuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eHNhY2JjaXF3cmFoamRpeHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3NzksImV4cCI6MjA3MzYyMTc3OX0.jnVjgixHQOHOakT0zEMKJBFDQU9WEAbJHgQ6w6UD0-U';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 Test de connexion Supabase WALTERA\n');

async function runTests() {
  try {
    // Test 1: Connexion
    console.log('1️⃣ Test de connexion...');
    const { error: pingError } = await supabase.from('zones_sante').select('count', { count: 'exact', head: true });

    if (pingError) {
      console.error('❌ Erreur de connexion:', pingError.message);
      return;
    }
    console.log('✅ Connexion OK\n');

    // Test 2: Compter zones_sante
    console.log('2️⃣ Table zones_sante...');
    const { count: zonesCount, error: zonesCountError } = await supabase
      .from('zones_sante')
      .select('*', { count: 'exact', head: true });

    if (zonesCountError) {
      console.error('❌ Erreur:', zonesCountError.message);
    } else {
      console.log(`✅ ${zonesCount} lignes trouvées\n`);
    }

    // Test 3: Exemples de zones
    console.log('3️⃣ Exemples de zones_sante...');
    const { data: zonesData, error: zonesError } = await supabase
      .from('zones_sante')
      .select('*')
      .limit(5);

    if (zonesError) {
      console.error('❌ Erreur:', zonesError.message);
    } else if (!zonesData || zonesData.length === 0) {
      console.log('⚠️  TABLE VIDE - Aucune donnée trouvée');
    } else {
      console.log('✅ Exemples:', zonesData);
      console.log('');
    }

    // Test 4: Chercher Paris (75)
    console.log('4️⃣ Recherche Paris (75) pour SENIORS...');
    const { data: parisData, error: parisError } = await supabase
      .from('zones_sante')
      .select('*')
      .eq('type_zone', 'SENIORS')
      .eq('departement', '75');

    if (parisError) {
      console.error('❌ Erreur:', parisError.message);
    } else if (!parisData || parisData.length === 0) {
      console.log('⚠️  Non trouvé - département 75 absent pour SENIORS');
    } else {
      console.log('✅ Trouvé:', parisData);
    }
    console.log('');

    // Test 5: Chercher Eure (27) pour TNS
    console.log('5️⃣ Recherche Eure (27) pour TNS...');
    const { data: dept27Data, error: dept27Error } = await supabase
      .from('zones_sante')
      .select('*')
      .eq('type_zone', 'TNS')
      .eq('departement', '27');

    if (dept27Error) {
      console.error('❌ Erreur:', dept27Error.message);
    } else if (!dept27Data || dept27Data.length === 0) {
      console.log('⚠️  Non trouvé - département 27 absent pour TNS');
    } else {
      console.log('✅ Trouvé:', dept27Data);
    }
    console.log('');

    // Test 6: Compter tarifs_sante
    console.log('6️⃣ Table tarifs_sante...');
    const { count: tarifsCount, error: tarifsCountError } = await supabase
      .from('tarifs_sante')
      .select('*', { count: 'exact', head: true });

    if (tarifsCountError) {
      console.error('❌ Erreur:', tarifsCountError.message);
    } else {
      console.log(`✅ ${tarifsCount} lignes trouvées\n`);
    }

    // Test 7: Exemple de tarif
    console.log('7️⃣ Exemple de tarif...');
    const { data: tarifData, error: tarifError } = await supabase
      .from('tarifs_sante')
      .select('*')
      .limit(1);

    if (tarifError) {
      console.error('❌ Erreur:', tarifError.message);
    } else if (!tarifData || tarifData.length === 0) {
      console.log('⚠️  TABLE VIDE - Aucun tarif trouvé');
    } else {
      console.log('✅ Exemple:', tarifData[0]);
    }

    console.log('\n📊 Résumé:');
    console.log(`   - Zones: ${zonesCount || 0} lignes`);
    console.log(`   - Tarifs: ${tarifsCount || 0} lignes`);

    if (zonesCount === 0 || tarifsCount === 0) {
      console.log('\n⚠️  ATTENTION: Les tables sont vides !');
      console.log('   Les données doivent être importées pour que le tarificateur fonctionne.');
    }

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

runTests();
