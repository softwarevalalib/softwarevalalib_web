import { COMPANY_WHATSAPP } from "../config/company";

export function whatsappSpecialistUrl({ service = "", page = "" } = {}) {
  const lines = [
    "Hello Software Vala Liberia,",
    "",
    "I'm interested in discussing a technology solution for my business/organization.",
  ];
  if (service) lines.push("", `Service: ${service}`);
  if (page) lines.push(`Page: ${page}`);
  return `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}
