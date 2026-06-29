import QRCode from 'qrcode';

/**
 * Generates a Base64 QR Code string for a given text.
 * @param {string} text - The content to encode in the QR code (typically booking ID)
 * @returns {Promise<string>} Base64 data URI representing the QR Code image
 */
export const generateQR = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#0f172a', // dark blue/slate
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    throw err;
  }
};
