import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = 'noreply@waltera.gared.fr';

interface CcnAlert {
  idcc: string;
  label: string;
  title: string;
  detected_terms: string[];
  summary?: string;
  impacted_clients?: string[];
}

interface ComplianceAlert {
  idcc: string;
  ccn_label: string;
  client_name: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  recommended_action?: string;
}

interface AlertEmailRequest {
  alerts: CcnAlert[];
  compliance_alerts?: ComplianceAlert[];
  import_date: string;
  import_id: string;
}

// Get users who have opted in to receive CCN alerts
async function getOptedInUsers(): Promise<{ email: string; first_name: string | null }[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('profiles')
    .select('email, first_name')
    .or('receive_ccn_alerts.is.null,receive_ccn_alerts.eq.true');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}

// Get pending compliance alerts from database
async function getPendingComplianceAlerts(importId: string): Promise<ComplianceAlert[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from('ccn_compliance_alerts')
    .select('idcc, ccn_label, client_name, severity, category, title, description, recommended_action')
    .eq('import_log_id', importId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching compliance alerts:', error);
    return [];
  }

  return data || [];
}

// Generate compliance alerts HTML section
function generateComplianceAlertsHtml(alerts: ComplianceAlert[]): string {
  if (alerts.length === 0) return '';

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', badge: '#dc2626' };
      case 'warning':
        return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', badge: '#f59e0b' };
      default:
        return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', badge: '#3b82f6' };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRITIQUE';
      case 'warning': return 'ATTENTION';
      default: return 'INFO';
    }
  };

  const alertsHtml = alerts.map(alert => {
    const style = getSeverityStyle(alert.severity);
    return `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background-color: ${style.badge}; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-right: 6px;">
            ${getSeverityLabel(alert.severity)}
          </span>
          <span style="display: inline-block; background-color: #3E7A84; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-right: 6px;">
            IDCC ${alert.idcc}
          </span>
          <span style="font-size: 12px; color: #6b7280;">${alert.ccn_label || ''}</span>
        </div>
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
          ${alert.client_name}
        </div>
        <div style="font-weight: 500; color: #374151; margin-bottom: 8px; font-size: 14px;">
          ${alert.title}
        </div>
        <p style="margin: 0 0 8px; font-size: 13px; color: #4b5563; line-height: 1.5;">
          ${alert.description}
        </p>
        ${alert.recommended_action ? `
          <div style="margin-top: 8px; padding: 8px; background-color: #f0fdf4; border-radius: 4px; border-left: 2px solid #22c55e;">
            <p style="margin: 0; font-size: 12px; color: #166534;">
              <strong>Action recommandee:</strong> ${alert.recommended_action}
            </p>
          </div>
        ` : ''}
      </td>
    </tr>
  `;
  }).join('');

  // Group by severity for summary
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const severitySummary = [
    criticalCount > 0 ? `${criticalCount} critique${criticalCount > 1 ? 's' : ''}` : '',
    warningCount > 0 ? `${warningCount} attention` : '',
    infoCount > 0 ? `${infoCount} info` : '',
  ].filter(Boolean).join(', ');

  return `
    <!-- Compliance Alerts Section -->
    <tr>
      <td style="padding: 24px 32px 16px;">
        <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 16px; font-weight: 600; border-top: 2px solid #e5e7eb; padding-top: 24px;">
          Analyse de conformite AI
        </h3>
        <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
          ${alerts.length} ecart${alerts.length > 1 ? 's' : ''} de conformite detecte${alerts.length > 1 ? 's' : ''} (${severitySummary})
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 24px;">
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
          <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
            <strong>Important :</strong> L'analyse IA a detecte des ecarts potentiels entre les exigences des conventions collectives et les contrats de vos clients. Verifiez ces alertes dans le monitoring CCN.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr>
              <th style="padding: 12px 16px; text-align: left; background-color: #dc2626; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Alertes de conformite
              </th>
            </tr>
          </thead>
          <tbody>
            ${alertsHtml}
          </tbody>
        </table>
      </td>
    </tr>
  `;
}

// Generate email HTML
function generateEmailHtml(alerts: CcnAlert[], complianceAlerts: ComplianceAlert[], importDate: string): string {
  const hasKeywordAlerts = alerts.length > 0;
  const hasComplianceAlerts = complianceAlerts.length > 0;
  const totalAlerts = alerts.length + complianceAlerts.length;

  const alertsHtml = alerts.map(alert => {
    const clientsSection = alert.impacted_clients && alert.impacted_clients.length > 0
      ? `
        <div style="margin-top: 12px; padding: 10px; background-color: #fef2f2; border-radius: 6px; border-left: 3px solid #ef4444;">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #991b1b; text-transform: uppercase;">
            Clients potentiellement impactes
          </p>
          <p style="margin: 0; font-size: 13px; color: #7f1d1d;">
            ${alert.impacted_clients.join(', ')}
          </p>
        </div>
      `
      : '';

    return `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background-color: #3E7A84; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">
            IDCC ${alert.idcc}
          </span>
          <span style="font-size: 12px; color: #6b7280;">${alert.label}</span>
        </div>
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
          ${alert.title}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
          ${alert.detected_terms.map(term => `
            <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; padding: 2px 6px; border-radius: 3px;">
              ${term}
            </span>
          `).join('')}
        </div>
        ${alert.summary ? `<p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">${alert.summary}</p>` : ''}
        ${clientsSection}
      </td>
    </tr>
  `;
  }).join('');

  // Count total impacted clients from keyword alerts
  const allImpactedClients = new Set<string>();
  alerts.forEach(alert => {
    if (alert.impacted_clients) {
      alert.impacted_clients.forEach(client => allImpactedClients.add(client));
    }
  });
  const totalImpactedClients = allImpactedClients.size;

  const impactSummary = totalImpactedClients > 0
    ? `
      <tr>
        <td style="padding: 0 32px 24px;">
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
              <strong>${totalImpactedClients} client${totalImpactedClients > 1 ? 's' : ''} potentiellement impacte${totalImpactedClients > 1 ? 's' : ''}</strong> par ces modifications.
              Verifiez leurs contrats dans l'onglet "Contrats" du monitoring CCN.
            </p>
          </div>
        </td>
      </tr>
    `
    : '';

  const keywordAlertsSection = hasKeywordAlerts ? `
    <!-- Title for keyword alerts -->
    <tr>
      <td style="padding: 32px 32px 16px;">
        <h3 style="margin: 0 0 8px; color: #1f2937; font-size: 16px; font-weight: 600;">
          Modifications de conventions collectives
        </h3>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">
          ${alerts.length} alerte${alerts.length > 1 ? 's' : ''} de termes sensibles
        </p>
      </td>
    </tr>

    <!-- Info box -->
    <tr>
      <td style="padding: 0 32px 24px;">
        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 1.5;">
            <strong>Attention :</strong> Les modifications ci-dessous concernent des clauses sensibles pouvant impacter les contrats de vos clients.
          </p>
        </div>
      </td>
    </tr>

    ${impactSummary}

    <!-- Keyword alerts list -->
    <tr>
      <td style="padding: 0 32px 32px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr>
              <th style="padding: 12px 16px; text-align: left; background-color: #f97316; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Alertes de modifications
              </th>
            </tr>
          </thead>
          <tbody>
            ${alertsHtml}
          </tbody>
        </table>
      </td>
    </tr>
  ` : '';

  const complianceAlertsSection = generateComplianceAlertsHtml(complianceAlerts);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alertes CCN - WALTERA</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; background: linear-gradient(135deg, #5A949E 0%, #3E7A84 100%); border-radius: 12px 12px 0 0;">
              <img src="https://waltera-staging.web.app/logWalteraBlanc.webp"
                   alt="WALTERA - Conseil & Assurances"
                   width="200"
                   height="auto"
                   style="max-width: 200px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 24px 32px 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 16px;">
                  ${totalAlerts} alerte${totalAlerts > 1 ? 's' : ''}
                </span>
                ${hasComplianceAlerts ? `
                  <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px;">
                    ${complianceAlerts.length} conformite
                  </span>
                ` : ''}
              </div>
              <h2 style="margin: 0 0 8px; color: #1f2937; font-size: 20px; font-weight: 600;">
                Rapport d'alertes CCN
              </h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Import du ${new Date(importDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </td>
          </tr>

          ${keywordAlertsSection}
          ${complianceAlertsSection}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="https://app.waltera.fr/ccn-monitoring" style="display: inline-block; background: linear-gradient(135deg, #5A949E 0%, #3E7A84 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Voir le detail sur WALTERA
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                Vous recevez cet email car vous avez active les notifications d'alertes CCN.
              </p>
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 11px;">
                Pour vous desabonner, modifiez vos preferences dans votre profil WALTERA.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Waltera. Tous droits reserves.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Generate plain text version
function generateTextContent(alerts: CcnAlert[], complianceAlerts: ComplianceAlert[], importDate: string): string {
  const totalAlerts = alerts.length + complianceAlerts.length;

  const keywordAlertsText = alerts.length > 0 ? alerts.map(alert => {
    const clientsInfo = alert.impacted_clients && alert.impacted_clients.length > 0
      ? `  Clients impactes: ${alert.impacted_clients.join(', ')}\n`
      : '';

    return `
- IDCC ${alert.idcc} - ${alert.label}
  ${alert.title}
  Termes detectes: ${alert.detected_terms.join(', ')}
  ${alert.summary || ''}
${clientsInfo}`;
  }).join('\n') : '';

  const complianceAlertsText = complianceAlerts.length > 0 ? complianceAlerts.map(alert => {
    const severityLabel = alert.severity === 'critical' ? '[CRITIQUE]' :
                          alert.severity === 'warning' ? '[ATTENTION]' : '[INFO]';
    return `
${severityLabel} IDCC ${alert.idcc} - ${alert.client_name}
  ${alert.title}
  ${alert.description}
  ${alert.recommended_action ? `Action recommandee: ${alert.recommended_action}` : ''}`;
  }).join('\n') : '';

  // Count total impacted clients
  const allImpactedClients = new Set<string>();
  alerts.forEach(alert => {
    if (alert.impacted_clients) {
      alert.impacted_clients.forEach(client => allImpactedClients.add(client));
    }
  });
  const totalImpactedClients = allImpactedClients.size;

  const impactNote = totalImpactedClients > 0
    ? `\n*** ${totalImpactedClients} client(s) potentiellement impacte(s) ***\n`
    : '';

  return `
WALTERA - Rapport d'alertes CCN

${totalAlerts} alerte(s) detectee(s)
Import du ${new Date(importDate).toLocaleDateString('fr-FR')}
${impactNote}
${alerts.length > 0 ? `
=== ALERTES DE MODIFICATIONS CCN ===
ATTENTION: Les modifications ci-dessous concernent des clauses sensibles pouvant impacter les contrats de vos clients.
${keywordAlertsText}
` : ''}
${complianceAlerts.length > 0 ? `
=== ALERTES DE CONFORMITE (Analyse IA) ===
L'analyse IA a detecte des ecarts potentiels entre les exigences des conventions collectives et les contrats de vos clients.
${complianceAlertsText}
` : ''}
Consultez le detail sur WALTERA: https://app.waltera.fr/ccn-monitoring

---
Vous recevez cet email car vous avez active les notifications d'alertes CCN.
Pour vous desabonner, modifiez vos preferences dans votre profil WALTERA.

(c) ${new Date().getFullYear()} Waltera. Tous droits reserves.
  `;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { alerts, compliance_alerts, import_date, import_id }: AlertEmailRequest = await req.json();

    // Fetch compliance alerts from database if not provided
    let complianceAlerts = compliance_alerts || [];
    if (complianceAlerts.length === 0 && import_id) {
      complianceAlerts = await getPendingComplianceAlerts(import_id);
    }

    const hasKeywordAlerts = alerts && alerts.length > 0;
    const hasComplianceAlerts = complianceAlerts.length > 0;

    if (!hasKeywordAlerts && !hasComplianceAlerts) {
      return new Response(
        JSON.stringify({ success: true, message: 'No alerts to send' }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Get opted-in users
    const users = await getOptedInUsers();

    if (users.length === 0) {
      console.log('No users opted in for CCN alerts');
      return new Response(
        JSON.stringify({ success: true, message: 'No users opted in', sent_count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const keywordAlerts = alerts || [];
    const htmlContent = generateEmailHtml(keywordAlerts, complianceAlerts, import_date);
    const textContent = generateTextContent(keywordAlerts, complianceAlerts, import_date);

    const totalAlerts = keywordAlerts.length + complianceAlerts.length;

    // Generate subject based on alert types
    let subject = '[Alerte CCN]';
    if (hasKeywordAlerts && hasComplianceAlerts) {
      subject += ` ${keywordAlerts.length} modification${keywordAlerts.length > 1 ? 's' : ''} + ${complianceAlerts.length} conformite`;
    } else if (hasKeywordAlerts) {
      subject += ` ${keywordAlerts.length} modification${keywordAlerts.length > 1 ? 's' : ''} detectee${keywordAlerts.length > 1 ? 's' : ''}`;
    } else {
      subject += ` ${complianceAlerts.length} alerte${complianceAlerts.length > 1 ? 's' : ''} de conformite`;
    }

    // Send emails to all opted-in users
    const emailPromises = users.map(async (user) => {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `WALTERA Alertes <${FROM_EMAIL}>`,
            to: [user.email],
            subject,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Failed to send email to ${user.email}:`, errorData);
          return { email: user.email, success: false, error: errorData };
        }

        const result = await response.json();
        console.log(`Email sent to ${user.email}, messageId: ${result.id}`);
        return { email: user.email, success: true, messageId: result.id };
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        return { email: user.email, success: false, error: String(error) };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    // Update notifications as sent in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update keyword alerts
    for (const alert of keywordAlerts) {
      await supabase
        .from('ccn_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('idcc', alert.idcc)
        .eq('status', 'pending');
    }

    // Update compliance alerts
    if (import_id && complianceAlerts.length > 0) {
      await supabase
        .from('ccn_compliance_alerts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('import_log_id', import_id)
        .eq('status', 'pending');
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: successCount,
        total_users: users.length,
        keyword_alerts: keywordAlerts.length,
        compliance_alerts: complianceAlerts.length,
        results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});
