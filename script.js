const fileEl = document.getElementById('pdfFile');
const runBtn = document.getElementById('runBtn');

const propertyInput = document.getElementById('property-input');
const clientInput = document.getElementById('client-input');
const taskInput = document.getElementById('task-input');
const issuedInput = document.getElementById('issued-input');
const performedInput = document.getElementById('performed-input');

const propertyOuput = document.getElementById('property');
const clientOutput = document.getElementById('client');
const taskOutput = document.getElementById('task');
const issuedOutput = document.getElementById('issued');
const performedOutput = document.getElementById('performed');


runBtn.addEventListener('click', async () => {
  try {
    const file = fileEl.files?.[0];
    if (!file) return alert('Choose a PDF first.');

    const pdfBytes = await file.arrayBuffer();
    const { PDFDocument, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // 1. Convert your HTML element into a canvas image
    const element = document.getElementById('myHeader');
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());

    const element2 = document.getElementById('myFooter');
    const canvas2 = await html2canvas(element2, {backgroundColor: '#ffffff', scale: 2});
    const dataUrl2 = canvas2.toDataURL('image2/png');
    const imgBytes2 = await fetch(dataUrl2).then(res => res.arrayBuffer());

    // 2. Embed the image in the PDF
    const pngImage = await pdfDoc.embedPng(imgBytes);
    const pageW = firstPage.getWidth();
    const pageH = firstPage.getHeight();

    const footerImage = await pdfDoc.embedPng(imgBytes2);

    // scale image to full page width
    const imgW = pageW;
    const imgH = (pngImage.height / pngImage.width) * imgW;
    const imgH2 = (footerImage.height / footerImage.width) * imgW;

    const logoBytes = await fetch('aces.png').then(res => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoBytes); // or embedJpg

    // Optional: white bar behind it
    firstPage.drawRectangle({
      x: 0,
      y: pageH - imgH,
      width: pageW,
      height: imgH,
      color: rgb(1, 1, 1),
    });

    for (const page of pages) {
      const pageW = page.getWidth();
      const pageH = page.getHeight();

      page.drawRectangle({
        x: 0,
        y: pageH - 50,   // top of page
        width: pageW,
        height: 110,
        color: rgb(1, 1, 1),
      });

      // Draw the logo inside that rectangle
  const logoW = 113; // scale as needed
  const logoH = 40;  // scale as needed
  const margin = 450; // distance from left & top edges

  page.drawImage(logoImage, {
    x: margin,
    y: pageH - logoH - (75 - logoH) / 2, // center it vertically in 100px bar
    width: logoW,
    height: logoH,
  });
    
      // White box at the bottom (100pt tall, full width)
      page.drawRectangle({
        x: 0,
        y: 0,             // bottom of the page
        width: pageW,
        height: 50,      // 100pt tall
        color: rgb(1, 1, 1)
      });

      // Draw the image at the top of the page
    page.drawImage(footerImage, {
      x: 0,
      y: 0,
      width: pageW,
      height: imgH2,
    });
    }

    // Draw the image at the top of the page
    firstPage.drawImage(pngImage, {
      x: 0,
      y: pageH - imgH,
      width: imgW,
      height: imgH,
    });

    // 3. Save and download
    const outBytes = await pdfDoc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ACES-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Something went wrong — check console.');
  }
});

propertyInput.addEventListener('input', () => {
  property.innerHTML = propertyInput.value;
});

clientInput.addEventListener('input', () => {
  clientOutput.innerHTML = clientInput.value;
});

taskInput.addEventListener('input', () => {
  taskOutput.innerHTML = taskInput.value;
});

issuedInput.addEventListener('input', () => {
  issuedOutput.innerHTML = formatDatePretty(issuedInput.value);
});

performedInput.addEventListener('input', () => {
  performedOutput.innerHTML = formatDatePretty(performedInput.value);
});

function formatDatePretty(dateInput) {
  const date = new Date(dateInput);

  if (isNaN(date)) return ''; // invalid date

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' }); // "Nov"
  const year = date.getFullYear();

  // add ordinal suffix
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix} ${month} ${year}`;
}