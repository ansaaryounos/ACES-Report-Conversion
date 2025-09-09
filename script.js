// Requirements in your HTML:
// <script src="https://unpkg.com/pdf-lib/dist/pdf-lib.min.js"></script>
// <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
// An <input type="file" id="pdfFile" accept="application/pdf">
// A <button id="runBtn">Overlay</button>
// An element to capture: <div id="myHeader"> ...children... </div>

const fileEl = document.getElementById('pdfFile');
const runBtn = document.getElementById('runBtn');

const ELEMENT_ID = 'myHeader';    // <- your element must have this id
const APPLY_TO_ALL_PAGES = false;
const COVER_OLD_HEADER = true;
const RENDER_SCALE = 1;
const PT_PER_CSS_PX = 72 / 96;

runBtn.addEventListener('click', async () => {
  try {
    const file = fileEl.files?.[0];
    if (!file) return alert('Choose a PDF first.');

    // 1) Load PDF
    const pdfBytes = await file.arrayBuffer();
    const { PDFDocument, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    // 2) Find the element
    const el = document.getElementById(ELEMENT_ID);
    if (!el) throw new Error(`#${ELEMENT_ID} not found`);

    // Ensure fonts loaded
    if (document.fonts?.ready) await document.fonts.ready;

    // 3) Capture element + children with html2canvas
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: RENDER_SCALE,
      useCORS: true,
      foreignObjectRendering: true,
      onclone: (doc) => {
        const cloneEl = doc.getElementById(ELEMENT_ID);
        if (!cloneEl) return;
        // strip problematic styles during render
        cloneEl.querySelectorAll('*').forEach(node => {
          node.style.mixBlendMode = 'normal';
          node.style.filter = 'none';
        });
      }
    });
    

    // Debug: append the canvas to page so you can check it
    document.body.appendChild(canvas);

    // 4) Convert canvas to PNG bytes
    const dataUrl = canvas.toDataURL('image/png');
    const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
    const png = await pdfDoc.embedPng(imgBytes);

    // 5) Compute size in PDF points
    const rect = el.getBoundingClientRect();
    const naturalWpt = rect.width * PT_PER_CSS_PX;
    const naturalHpt = rect.height * PT_PER_CSS_PX;

    function drawOnPage(page) {
      const pageW = page.getWidth();
      const pageH = page.getHeight();

      // scale to full page width
      const drawW = pageW;
      const drawH = (naturalHpt / naturalWpt) * drawW;

      const x = 0;
      const y = pageH - drawH;

      if (COVER_OLD_HEADER) {
        page.drawRectangle({ x, y, width: pageW, height: drawH, color: rgb(1,1,1) });
      }

      page.drawImage(png, { x, y, width: drawW, height: drawH });
    }

    if (APPLY_TO_ALL_PAGES) {
      for (const page of pages) drawOnPage(page);
    } else {
      drawOnPage(pages[0]);
    }

    // 6) Save and download
    const out = await pdfDoc.save();
    const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `overlay-${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert(err.message || 'Something went wrong — see console.');
  }
});
