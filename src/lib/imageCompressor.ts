export const compressImage = (file: File, maxSizeKb: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        
        let minQ = 0;
        let maxQ = 1;
        let quality = 0.7;
        let bestBase64 = canvas.toDataURL('image/jpeg', quality);
        let currentSize = Math.round((bestBase64.length * 3) / 4) / 1024;
        
        if (currentSize <= maxSizeKb) {
           return resolve(bestBase64);
        }
        
        for (let i = 0; i < 7; i++) {
           const testBase64 = canvas.toDataURL('image/jpeg', quality);
           const testSize = Math.round((testBase64.length * 3) / 4) / 1024;
           if (testSize <= maxSizeKb) {
               bestBase64 = testBase64;
               minQ = quality;
           } else {
               maxQ = quality;
           }
           quality = (minQ + maxQ) / 2;
        }
        
        // If still slightly over, try scaling down dimensions
        currentSize = Math.round((bestBase64.length * 3) / 4) / 1024;
        if (currentSize > maxSizeKb) {
            const scale = Math.sqrt(maxSizeKb / currentSize) * 0.9;
            canvas.width = width * scale;
            canvas.height = height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            bestBase64 = canvas.toDataURL('image/jpeg', 0.5);
        }

        resolve(bestBase64);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};
