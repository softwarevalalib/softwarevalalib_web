const INFO_EMAIL = "info@softwarevalalib.app";

/**
 * Same delivery path as the public site forms: FormSubmit → info@softwarevalalib.app.
 * Academy mail stays on its own path and must not use this helper.
 */
export async function notifyInfoInbox({ subject, fields }) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(INFO_EMAIL)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      ...fields,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to deliver the message to the info inbox.");
  }
  return result;
}
