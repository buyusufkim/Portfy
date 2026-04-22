export type DocumentType = 'yer-gosterme' | 'yetki-sozlesmesi' | 'teklif-formu';

interface DocumentData {
  property?: any;
  lead?: any;
  agent?: any;
  date?: string;
  customNotes?: string;
}

export const documentService = {
  generatePDF: async (type: DocumentType, data: DocumentData, elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Dynamically import heavy libraries only when needed
    const { jsPDF } = await import('jspdf');
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default ? html2canvasModule.default : html2canvasModule;

    // PRE-SANITIZATION: Strip problematic colors from stylesheets to avoid html2canvas parser crash
    const styleRef = document.createElement('style');
    styleRef.innerHTML = `
      * { 
        color-scheme: light !important;
      }
    `;
    document.head.appendChild(styleRef);

    const canvas = await (html2canvas as any)(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc: Document) => {
        // ...Existing onclone logic...
        const elements = clonedDoc.getElementsByTagName("*");
        const styleTags = clonedDoc.getElementsByTagName("style");
        
        // Remove or sanitize style tags in the clone that might contain oklch or oklab
        for (let i = 0; i < styleTags.length; i++) {
          const cssText = styleTags[i].innerHTML;
          if (cssText.includes('oklch') || cssText.includes('oklab')) {
            // Replace oklch/oklab with a safe fallback in the entire CSS string
            styleTags[i].innerHTML = cssText.replace(/(oklch|oklab)\([^)]+\)/g, '#64748b');
          }
        }

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          
          const checkAndFix = (prop: string, fallback: string) => {
            const val = el.style.getPropertyValue(prop) || window.getComputedStyle(el).getPropertyValue(prop);
            if (val && (val.includes('oklch') || val.includes('oklab'))) {
              el.style.setProperty(prop, fallback, 'important');
            }
          };

          checkAndFix('background-color', '#ffffff');
          checkAndFix('color', '#0f172a');
          checkAndFix('border-color', '#e2e8f0');
          checkAndFix('fill', 'currentColor');
          checkAndFix('stroke', 'currentColor');
          
          const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
          if (bg && (bg.includes('oklch') || bg.includes('oklab'))) {
            el.style.setProperty('background-image', 'none', 'important');
            el.style.setProperty('background-color', '#f8fafc', 'important');
          }
        }
      }
    });

    document.head.removeChild(styleRef);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${type}_${new Date().getTime()}.pdf`);
  }
};
