/** Client-side PDF from a DOM node (quotation / invoice preview). */
export async function exportDomToPdf(element: HTMLElement, fileName: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = canvas.width / canvas.height;
  let imgW = maxW;
  let imgH = imgW / ratio;
  if (imgH > maxH) {
    imgH = maxH;
    imgW = imgH * ratio;
  }
  pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
