import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NAS_BASE_URL = Deno.env.get('NAS_BASE_URL') || 'https://waltera75.direct.quickconnect.to:5001';
const NAS_USERNAME = Deno.env.get('NAS_USERNAME') || '';
const NAS_PASSWORD = Deno.env.get('NAS_PASSWORD') || '';
const NAS_SCAN_PATH = '/PORTEFEUILLE/1 - Clients';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_DEPTH = 5;
const MAX_SCAN_TIME_MS = 30000;

async function supabaseInsert(table: string, data: any): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function supabaseSelect(table: string, query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function nasAuth(): Promise<string> {
  const url = `${NAS_BASE_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(NAS_USERNAME)}&passwd=${encodeURIComponent(NAS_PASSWORD)}&session=FileStation&format=sid`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(`NAS auth failed: ${JSON.stringify(data.error)}`);
  return data.data.sid;
}

async function nasLogout(sid: string): Promise<void> {
  try {
    await fetch(`${NAS_BASE_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=logout&session=FileStation&_sid=${sid}`);
  } catch { /* ignore */ }
}

async function listFolder(sid: string, path: string): Promise<any[]> {
  const url = `${NAS_BASE_URL}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list&folder_path=${encodeURIComponent(path)}&additional=["size","time"]&limit=1000&_sid=${sid}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) return [];
  return data.data?.files || [];
}

async function scanFolder(sid: string, path: string, depth = 0, startTime = Date.now(), maxFiles = 100): Promise<any[]> {
  if (depth > MAX_DEPTH) return [];
  if (Date.now() - startTime > MAX_SCAN_TIME_MS) return [];

  const files: any[] = [];
  const items = await listFolder(sid, path);

  for (const item of items) {
    if (files.length >= maxFiles) break;
    if (Date.now() - startTime > MAX_SCAN_TIME_MS) break;

    if (item.isdir) {
      const sub = await scanFolder(sid, `${path}/${item.name}`, depth + 1, startTime, maxFiles - files.length);
      files.push(...sub);
    } else {
      const ext = (item.name.split('.').pop() || '').toLowerCase();
      if (['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'csv'].includes(ext)) {
        const size = item.additional?.size || 0;
        if (size > 100 && size < 50 * 1024 * 1024) {
          const fullPath = `${path}/${item.name}`;
          const codeMatch = fullPath.match(/\/G(\d{4})_/);
          files.push({
            path: fullPath,
            name: item.name,
            ext,
            size,
            mtime: item.additional?.time?.mtime || 0,
            client_code: codeMatch ? `G${codeMatch[1]}` : null,
          });
        }
      }
    }
  }
  return files;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!NAS_USERNAME || !NAS_PASSWORD) {
      return new Response(JSON.stringify({ error: 'NAS credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body */ }

    const sid = await nasAuth();

    try {
      // Action: list_folders
      if (body.action === 'list_folders') {
        const path = body.path || NAS_SCAN_PATH;
        const items = await listFolder(sid, path);
        const folders = items.map((i: any) => ({ name: i.name, isdir: i.isdir }));
        return new Response(JSON.stringify({ success: true, path, folders }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Action: scan_only
      if (body.action === 'scan_only') {
        const path = body.path || NAS_SCAN_PATH;
        const maxFiles = body.max_files || 50;
        const files = await scanFolder(sid, path, 0, Date.now(), maxFiles);
        return new Response(JSON.stringify({
          success: true,
          path,
          files_found: files.length,
          files: files.slice(0, 20).map(f => ({ name: f.name, ext: f.ext, size: f.size, path: f.path }))
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Action: index_metadata (index file metadata only - no content extraction)
      if (body.action === 'index_metadata') {
        const path = body.path || NAS_SCAN_PATH;
        const maxFiles = body.max_files || 20;

        // Scan files
        const files = await scanFolder(sid, path, 0, Date.now(), maxFiles);

        // Get existing file paths
        const existingPaths = new Set<string>();
        const existingDocs = await supabaseSelect('nas_files', `select=file_path`);
        existingDocs?.forEach((d: any) => existingPaths.add(d.file_path));

        // Insert new files
        let indexed = 0;
        const errors: string[] = [];

        for (const file of files) {
          if (existingPaths.has(file.path)) continue;

          try {
            const success = await supabaseInsert('nas_files', {
              file_path: file.path,
              file_name: file.name,
              file_ext: file.ext,
              file_size: file.size,
              file_mtime: file.mtime,
              client_code: file.client_code,
              status: 'pending',
            });

            if (success) indexed++;
          } catch (e) {
            errors.push(`${file.name}: ${e instanceof Error ? e.message : 'Unknown'}`);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          path,
          scanned: files.length,
          indexed,
          errors: errors.slice(0, 5),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Default: return help
      return new Response(JSON.stringify({
        success: true,
        message: 'Available actions: list_folders, scan_only, index_metadata',
        example: {
          list_folders: { action: 'list_folders', path: '/PORTEFEUILLE/1 - Clients' },
          scan_only: { action: 'scan_only', path: '/PORTEFEUILLE/1 - Clients/G0031_Gared', max_files: 20 },
          index_metadata: { action: 'index_metadata', path: '/PORTEFEUILLE/1 - Clients/G0031_Gared', max_files: 20 },
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } finally {
      await nasLogout(sid);
    }

  } catch (error) {
    console.error('[nas-sync] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal error',
      success: false
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
