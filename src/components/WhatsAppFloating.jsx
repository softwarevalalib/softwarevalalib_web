import { AiOutlineWhatsApp } from "react-icons/ai";

const WHATSAPP_NUMBER = "231888636071";
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;

function WhatsAppFloating() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-float fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-transform duration-300 hover:scale-110 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <AiOutlineWhatsApp size={28} />
    </a>
  );
}

export default WhatsAppFloating;
