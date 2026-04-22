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

    const canvas = await (html2canvas as any)(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

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
