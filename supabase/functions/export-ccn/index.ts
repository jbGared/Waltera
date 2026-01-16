import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Hiérarchie juridique des textes CCN
const TYPE_TEXT_PRIORITY: Record<string, number> = {
  'ARRETE_EXTENSION': 1,
  'ARRETE_AGREMENT': 1,
  'ARRETE': 1,
  'AVENANT': 2,
  'ACCORD_SALAIRES': 3,
  'ACCORD_PREVOYANCE': 3,
  'ACCORD_FORMATION': 3,
  'ACCORD_RETRAITE': 3,
  'ACCORD': 3,
  'ANNEXE': 4,
  'TEXTE_BASE': 5,
  'UNKNOWN': 6
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Arretes (force obligatoire)',
  2: 'Avenants (modifications)',
  3: 'Accords thematiques',
  4: 'Annexes',
  5: 'Texte de base',
  6: 'Autres textes'
};

interface ExportRequest {
  idcc: string;
  format: 'markdown' | 'pdf';
}

interface CCNDocument {
  kali_id: string;
  titre: string;
  type_text: string;
  etat_juridique: string;
  date_debut: string;
  date_signature: string;
  url_legifrance: string;
  content: string;
}

Deno.serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 1. Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifie' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non trouve' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 2. Parse request
    const body: ExportRequest = await req.json();
    const { idcc, format = 'markdown' } = body;

    if (!idcc) {
      return new Response(JSON.stringify({ error: 'IDCC requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log(`[export-ccn] Export CCN ${idcc} au format ${format}`);

    // 3. Client admin pour acceder aux donnees
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Recuperer les infos de la CCN
    const { data: ccnInfo, error: ccnError } = await supabaseAdmin
      .from('idcc_ref')
      .select('idcc, label')
      .eq('idcc', idcc)
      .single();

    if (ccnError || !ccnInfo) {
      return new Response(JSON.stringify({ error: 'CCN non trouvee' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log(`[export-ccn] CCN trouvee: ${ccnInfo.label}`);

    // 5. Recuperer tous les chunks de la CCN
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('ccn')
      .select('content, metadata')
      .eq('metadata->>idcc', idcc);

    if (chunksError) {
      console.error('[export-ccn] Erreur recuperation chunks:', chunksError);
      return new Response(JSON.stringify({ error: 'Erreur recuperation documents' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun document trouve pour cette CCN' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log(`[export-ccn] ${chunks.length} chunks trouves`);

    // 6. Regrouper les chunks par document source (kali_id)
    const documentsMap = new Map<string, CCNDocument>();

    for (const chunk of chunks) {
      const metadata = chunk.metadata || {};
      const kaliId = metadata.kali_id || `unknown_${Math.random().toString(36).substr(2, 9)}`;

      if (!documentsMap.has(kaliId)) {
        documentsMap.set(kaliId, {
          kali_id: kaliId,
          titre: metadata.titre || 'Document sans titre',
          type_text: metadata.type_text || 'UNKNOWN',
          etat_juridique: metadata.etat_juridique || 'N/A',
          date_debut: metadata.date_debut || metadata.date_signature || '',
          date_signature: metadata.date_signature || '',
          url_legifrance: metadata.url_legifrance || '',
          content: '',
        });
      }

      const doc = documentsMap.get(kaliId)!;
      // Ajouter le contenu du chunk (avec separateur si deja du contenu)
      if (doc.content) {
        doc.content += '\n\n';
      }
      doc.content += chunk.content || '';
    }

    // 7. Trier les documents par hierarchie juridique puis par date
    const documents = Array.from(documentsMap.values())
      .filter(doc => {
        // Filtrer les textes abroges
        const etat = doc.etat_juridique.toUpperCase();
        return !etat.includes('ABROGE');
      })
      .sort((a, b) => {
        const priorityA = TYPE_TEXT_PRIORITY[a.type_text] || 6;
        const priorityB = TYPE_TEXT_PRIORITY[b.type_text] || 6;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Trier par date descendante si meme priorite
        const dateA = a.date_debut || a.date_signature || '';
        const dateB = b.date_debut || b.date_signature || '';
        return dateB.localeCompare(dateA);
      });

    console.log(`[export-ccn] ${documents.length} documents uniques apres filtrage`);

    // 8. Generer le contenu selon le format
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let content = '';

    if (format === 'markdown') {
      content = generateMarkdown(ccnInfo, documents, currentDate);
    } else {
      // Pour PDF, on genere d'abord le markdown puis on le convertit
      // Pour l'instant, on retourne le markdown avec un header indiquant que c'est pour PDF
      content = generateMarkdown(ccnInfo, documents, currentDate, true);
    }

    // 9. Retourner le contenu
    const contentType = format === 'markdown' ? 'text/markdown' : 'text/plain';
    const fileName = `CCN_${idcc}_${currentDate.replace(/ /g, '_')}.${format === 'markdown' ? 'md' : 'txt'}`;

    return new Response(content, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[export-ccn] Erreur:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

function generateMarkdown(
  ccnInfo: { idcc: string; label: string },
  documents: CCNDocument[],
  currentDate: string,
  forPdf = false
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Convention Collective Nationale`);
  lines.push(`## IDCC ${ccnInfo.idcc} - ${ccnInfo.label}`);
  lines.push('');
  lines.push(`> Document genere le ${currentDate} par WALTERA`);
  lines.push(`> Source: Legifrance`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table des matieres
  lines.push('## Table des matieres');
  lines.push('');

  // Regrouper par priorite pour la table des matieres
  const docsByPriority = new Map<number, CCNDocument[]>();
  for (const doc of documents) {
    const priority = TYPE_TEXT_PRIORITY[doc.type_text] || 6;
    if (!docsByPriority.has(priority)) {
      docsByPriority.set(priority, []);
    }
    docsByPriority.get(priority)!.push(doc);
  }

  const sortedPriorities = Array.from(docsByPriority.keys()).sort((a, b) => a - b);
  let tocIndex = 1;

  for (const priority of sortedPriorities) {
    const docs = docsByPriority.get(priority)!;
    const priorityLabel = PRIORITY_LABELS[priority] || 'Autres';

    lines.push(`### ${priority}. ${priorityLabel}`);
    lines.push('');

    for (const doc of docs) {
      const anchor = `doc-${tocIndex}`;
      lines.push(`- [${doc.titre}](#${anchor})`);
      tocIndex++;
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Contenu des documents
  let docIndex = 1;
  for (const priority of sortedPriorities) {
    const docs = docsByPriority.get(priority)!;
    const priorityLabel = PRIORITY_LABELS[priority] || 'Autres';

    lines.push(`# ${priority}. ${priorityLabel}`);
    lines.push('');

    for (const doc of docs) {
      const anchor = `doc-${docIndex}`;

      lines.push(`## ${docIndex}. ${doc.titre} {#${anchor}}`);
      lines.push('');

      // Metadonnees
      lines.push('| Information | Valeur |');
      lines.push('|-------------|--------|');
      lines.push(`| Type | ${doc.type_text} |`);
      lines.push(`| Etat | ${doc.etat_juridique} |`);
      if (doc.date_debut) {
        lines.push(`| Date debut | ${doc.date_debut} |`);
      }
      if (doc.date_signature) {
        lines.push(`| Date signature | ${doc.date_signature} |`);
      }
      if (doc.url_legifrance) {
        lines.push(`| Source | [Legifrance](${doc.url_legifrance}) |`);
      }
      lines.push('');

      // Contenu
      lines.push('### Contenu');
      lines.push('');
      lines.push(doc.content);
      lines.push('');
      lines.push('---');
      lines.push('');

      docIndex++;
    }
  }

  // Footer
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Document genere automatiquement par WALTERA le ${currentDate}.*`);
  lines.push('');
  lines.push('*Les informations contenues dans ce document proviennent de Legifrance. Pour toute decision juridique, veuillez consulter les textes officiels.*');

  return lines.join('\n');
}
