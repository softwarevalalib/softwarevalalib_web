import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import jsQR from "jsqr";

const root = dirname(fileURLToPath(import.meta.url));
const svgPath = join(root, "../public/brand/recruitment-qr.svg");
const pngPath = join(root, "../public/brand/recruitment-qr.png");
const url = "https://application.softwarevalalib.app/";

await QRCode.toFile(svgPath, url, { type: "svg", errorCorrectionLevel: "H", margin: 2 });
await QRCode.toFile(pngPath, url, { errorCorrectionLevel: "H", margin: 2, width: 1024 });

const png = PNG.sync.read(readFileSync(pngPath));
const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
if (decoded?.data !== url) {
  console.error("QR code did not decode to the production application URL.");
  process.exit(1);
}
console.log(`QR verified: ${decoded.data}`);
