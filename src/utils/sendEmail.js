import { COMPANY_EMAIL } from "../config/company";

/**
 * Sends form data to the company inbox via FormSubmit.
 * On first use, FormSubmit sends an activation link to COMPANY_EMAIL — click it once to enable delivery.
 */
export async function sendToCompany({ subject, fields }) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(COMPANY_EMAIL)}`, {
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

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Unable to send your message. Please try again.");
  }

  return result;
}
