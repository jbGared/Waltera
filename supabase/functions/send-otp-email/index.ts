import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'noreply@waltera.gared.fr';

interface OTPEmailRequest {
  email: string;
  code: string;
  expiresInMinutes: number;
}

Deno.serve(async (req: Request) => {
  // Gérer les requêtes CORS preflight
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
    const { email, code, expiresInMinutes }: OTPEmailRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email et code requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Template HTML de l'email
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification WALTERA</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #5A949E 0%, #3E7A84 100%); border-radius: 12px 12px 0 0;">
              <img src="https://waltera-staging.web.app/logWalteraBlanc.webp"
                   alt="WALTERA - Conseil & Assurances"
                   width="220"
                   height="auto"
                   style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #333333; font-size: 20px; font-weight: 600;">Code de vérification</h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 14px; line-height: 1.6;">
                Voici votre code de vérification pour accéder à votre espace WALTERA :
              </p>

              <!-- OTP Code -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3E7A84; font-family: 'Courier New', monospace;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0 0 8px; color: #666666; font-size: 14px;">
                Ce code expire dans <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Waltera. Tous droits réservés.
              </p>
              <p style="margin: 8px 0 0; color: #999999; font-size: 11px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
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

    // Version texte de l'email
    const textContent = `
WALTERA - Code de vérification

Votre code de vérification : ${code}

Ce code expire dans ${expiresInMinutes} minutes.

Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.

© ${new Date().getFullYear()} Waltera. Tous droits réservés.
    `;

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `WALTERA <${FROM_EMAIL}>`,
        to: [email],
        subject: `${code} - Votre code de vérification WALTERA`,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur Resend:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
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
