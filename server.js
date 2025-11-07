import express from 'express';
import nodemailer from 'nodemailer';
import { PDFDocument } from 'pdf-lib';

const app = express();
app.use(express.json({limit:'10mb'}));

// ← AQUÍ ESTABA EL ERROR: faltaba global.fetch
global.fetch = require('node-fetch');

app.post('/cafe', async (req, res) => {
  try {
    const { cliente, items, totalUSD, totalMXN, to, smtp } = req.body;

    // DESCARGA EL TEMPLATE
    const template = await fetch('https://estrategikmente.com/template.pdf')
      .then(r => r.arrayBuffer());

    const pdfDoc = await PDFDocument.load(template);
    const page = pdfDoc.getPage(0);
    const font = await pdfDoc.embedFont('Helvetica');
    const bold = await pdfDoc.embedFont('Helvetica-Bold');

    // COORDENADAS EXACTAS DE TU PDF #CAP-2025-111
    page.drawText(cliente,              {x: 72, y: 660, size:14, font:bold});
    page.drawText(`$${totalUSD}`,       {x: 72, y: 630, size:12, font});
    page.drawText(`$${totalMXN}`,       {x: 72, y: 610, size:12, font});

    let y = 540;
    items.forEach(i => {
      page.drawText(i.qty,              {x:  50, y, size:11, font});
      page.drawText(i.desc,             {x: 100, y, size:11, font});
      page.drawText(`$${i.price}`,      {x: 350, y, size:11, font});
      page.drawText(`$${i.amount}`,     {x: 450, y, size:11, font});
      y -= 22;
    });

    const pdfBytes = await pdfDoc.save();
    const mail = nodemailer.createTransport(smtp);
    await mail.sendMail({
      from: smtp.auth.user,
      to,
      subject: `Factura CAPOP #CAP-2025-111 - ${cliente}`,
      text: 'Factura CAPOP adjunta',
      attachments: [{ filename: 'CAPOP-INVOICE.pdf', content: pdfBytes }]
    });

    res.json({ok:true});
  } catch (e) {
    console.error('ERROR →', e.message);
    res.json({ok:false, error:e.message});
  }
});

app.listen(process.env.PORT || 3000);
