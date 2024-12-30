import { v4 as uuidv4 } from 'uuid';

export function svgToBase64(svgString) {
  return `data:image/svg+xml;base64,${btoa(encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)))}`
}

export const uuid = () => uuidv4();
