import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({});

interface InviteEmailParams {
  to: string;
  inviteCode: string;
  customerName: string;
  role: string;
  inviterName?: string;
}

export const handler = async (event: { action: string; arguments: InviteEmailParams }) => {
  console.log('Email handler invoked:', JSON.stringify(event));

  const { action, arguments: args } = event;

  if (action !== 'sendInviteEmail') {
    throw new Error(`Unknown action: ${action}`);
  }

  const { to, inviteCode, customerName, role, inviterName } = args;

  if (!to || !inviteCode || !customerName) {
    throw new Error('Missing required parameters: to, inviteCode, customerName');
  }

  const senderEmail = process.env.SENDER_EMAIL || 'noreply@heylook.ai';
  const appUrl = process.env.APP_URL || 'https://heylook.ai';
  const inviteUrl = `${appUrl}/?invite=${inviteCode}`;

  const roleLabel = role === 'admin' ? 'an administrator' : role === 'viewer' ? 'a viewer' : 'a team member';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${customerName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 480px; width: 100%; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #392599 0%, #4a2fb3 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">You're Invited!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; color: #1d1d1f; font-size: 16px; line-height: 1.5;">
                ${inviterName ? `<strong>${inviterName}</strong> has invited you` : 'You have been invited'} to join <strong>${customerName}</strong> on HeyLook as ${roleLabel}.
              </p>

              <p style="margin: 0 0 24px; color: #86868b; font-size: 14px; line-height: 1.5;">
                HeyLook helps fashion brands create stunning AI-generated product photos. Click the button below to create your account and get started.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display: inline-block; background: #392599; color: white; text-decoration: none; padding: 14px 32px; border-radius: 24px; font-size: 16px; font-weight: 500;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #86868b; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #392599; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background: #f5f5f7; text-align: center;">
              <p style="margin: 0; color: #86868b; font-size: 12px;">
                &copy; ${new Date().getFullYear()} HeyLook. All rights reserved.
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

  const textBody = `
You're invited to join ${customerName} on HeyLook!

${inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join ${customerName} as ${roleLabel}.

Click the link below to create your account and get started:
${inviteUrl}

---
HeyLook - AI-powered product photography for fashion brands
`;

  try {
    const command = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: `You're invited to join ${customerName} on HeyLook`,
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          Text: {
            Charset: 'UTF-8',
            Data: textBody,
          },
        },
      },
    });

    const result = await ses.send(command);
    console.log('Email sent successfully:', result.MessageId);

    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
