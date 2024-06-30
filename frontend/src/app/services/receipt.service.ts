import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Tesseract from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {

  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  preprocessImage(image: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const imgElement = new Image();
        imgElement.src = event.target.result;

        imgElement.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Unable to get canvas 2D context.'));
            return;
          }

          // Escalado
          const scale = 2;
          canvas.width = imgElement.width * scale;
          canvas.height = imgElement.height * scale;
          ctx.scale(scale, scale);
          ctx.drawImage(imgElement, 0, 0);

          // Conversión a escala de grises
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
          }
          ctx.putImageData(imageData, 0, 0);

          // Binarización
          for (let i = 0; i < data.length; i += 4) {
            const avg = data[i];
            const threshold = 128;
            const binary = avg > threshold ? 255 : 0;
            data[i] = binary;
            data[i + 1] = binary;
            data[i + 2] = binary;
          }
          ctx.putImageData(imageData, 0, 0);

          resolve(canvas);
        };

        imgElement.onerror = (error) => {
          reject(new Error('Error loading image.'));
        };
      };

      reader.onerror = (error) => {
        reject(new Error('Error reading file.'));
      };

      reader.readAsDataURL(image);
    });
  }

  async processReceipt(image: File): Promise<number | null> {
    try {
      const preprocessedCanvas = await this.preprocessImage(image);
      const preprocessedImageDataUrl = preprocessedCanvas.toDataURL();

      const result = await Tesseract.recognize(preprocessedImageDataUrl, 'spa', {
        logger: (m) => console.log(m)
      });

      const cleanedText = this.cleanText(result.data.text);
      const extractedInfo = this.extractImportantInfo(cleanedText);



      return extractedInfo;
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  }

  cleanText(text: string): string {
    return text.replace(/[^a-zA-Z0-9\s.,]/g, '').replace(/\s+/g, ' ').trim();
  }

  extractImportantInfo(text: string): any {
    const priceRegex = /\b\d{1,4}(?:[.,]\d{0,3})*(?:[.,]\d{2})?\b/g;
    const prices = text.match(priceRegex);
    const total = this.findTotal(text);
    
    if (prices) {
      for (let i = 0; i < prices.length; i++) {
        prices[i] = prices[i].replace(/\./g, '');
      }
    }
  
    return total ;
  }
  
  findTotal(text: string): number | null {
    let highestTotal: number | null = null;
    const totalRegex = /(?:Total|TOTAL|total)\s*[:]?[^\d]*(\d{1,4}(?:[.,]\d{0,3})*(?:[.,]\d{2})?)/g;
    let match;
    
    // Buscar valores que coincidan con la expresión regular
    while ((match = totalRegex.exec(text)) !== null) {
      const totalValue = parseInt(match[1].replace(/\./g, ''), 10);
      if (!isNaN(totalValue) && (highestTotal === null || totalValue > highestTotal)) {
        highestTotal = totalValue;
      }
    }
  
    // Si no se encontró ningún valor con la palabra "total", devolver el valor más alto encontrado
    if (highestTotal === null) {
      const priceRegex = /\b\d{1,4}(?:[.,]\d{0,3})*(?:[.,]\d{2})?\b/g;
      const prices = text.match(priceRegex);
      if (prices) {
        for (let i = 0; i < prices.length; i++) {
          const priceValue = parseInt(prices[i].replace(/\./g, ''), 10);
          if (!isNaN(priceValue) && (highestTotal === null || priceValue > highestTotal)) {
            highestTotal = priceValue;
          }
        }
      }
    }
  
    return highestTotal;
  }

  saveData(total: number, categoria: string, fecha: string): Observable<any> {
    const data = { total, categoria, fecha};
    return this.http.post<any>(`${this.apiUrl}/datos`, data);
  }

  getAllDatos() {
    return this.http.get<any[]>(`${this.apiUrl}/alldatos`);
  }

  deleteBoleta(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/datos/${id}`);
  }

  updateBoleta(id: number, total: number, categoria: string, fecha: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/datos/${id}`, { total, categoria, fecha });
  }

}
