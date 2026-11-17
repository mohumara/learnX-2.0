/**
 * Base HTML layout wrapper for all LearnX email templates.
 * Brand colour: #6c3bbd (purple).
 *
 * @param {string} content - Inner HTML to inject into the layout
 * @returns {string} Full HTML document
 */
export const base = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background: #f9fafb;">
  <div style="background: #6c3bbd; padding: 16px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 1.4rem;">LearnX</h1>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    ${content}
  </div>
  <p style="color: #9ca3af; font-size: 0.75rem; text-align: center; margin-top: 16px;">
    LearnX &middot; Nigeria's tutor marketplace
  </p>
</body>
</html>`;
