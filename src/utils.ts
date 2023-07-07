import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import { ITracking } from './interfaces/ITracking';

export function sanitizePrice(price: string): number {
  return parseInt(price.replace(/[^0-9.]/g, ''));
}

export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export async function downloadItemImage(pageImage: puppeteer.HTTPResponse, itemId: number): Promise<void> {
  fs.writeFile(`./assets/${itemId}.png`, await pageImage.buffer(), function(err) {
    if (err) { return console.log(err); }  
  });
}

export function extractMapPosition(webCoordenate: string): string {
  const coordenate = webCoordenate.substring(1);
  if (coordenate.indexOf('nova_vend') > -1) {
    const [_, x, y] = coordenate.split(',');
    return `@shopjump ${x} ${y}`;
  } else {
    return `@navi ${coordenate}`;
  }
}

export function listTrackedItems(items: ITracking[]): string {
  let message = 'Name | ID | Price\n';
  items.forEach((item) => {
    message += `${item.itemName} | ${item.id} | ${formatPrice(item.wantedPrice)}z\n`;
  });
  return message;
}