function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function verificationOtpTemplate({
  name,
  otp,
  expiresInMinutes,
}) {
  const safeName = escapeHtml(name);

  return {
    subject: "Verify your Offlix Manager account",

    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#ffffff;padding:40px;border-radius:12px;">

            <h1 style="margin-top:0;">
              Verify your account
            </h1>

            <p>
              Hello ${safeName},
            </p>

            <p>
              Use the verification code below to verify your
              Offlix Manager account.
            </p>

            <div style="margin:30px 0;text-align:center;">
              <div style="display:inline-block;padding:16px 24px;border:1px solid #ddd;border-radius:8px;font-size:32px;letter-spacing:8px;font-weight:bold;">
                ${otp}
              </div>
            </div>

            <p>
              This code expires in ${expiresInMinutes} minutes.
            </p>

            <p>
              If you did not request this code, you can safely ignore
              this email.
            </p>

            <p style="color:#666;font-size:13px;">
              Offlix Manager
            </p>

          </div>
        </body>
      </html>
    `,
  };
}