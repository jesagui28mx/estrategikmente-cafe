import express from 'express';
import nodemailer from 'nodemailer';
import { PDFDocument } from 'pdf-lib';
const app = express();
app.use(express.json({limit:'10mb'}));

app.post('/cafe', async (req, res) => {
  const {cliente, usd, mxn, to, smtp} = req.body;
  const pdf = await fetch('https://estrategikmente.com/template.pdf').then(r=>r.arrayBuffer());
  const doc = await PDFDocument.load(pdf);
  const page = doc.getPage(0);
  page.drawText(cliente, {x:180, y:580, size:12});
  page.drawText(`$${usd}`, {x:180, y:550, size:12});
  page.drawText(`$${mxn}`, {x:180, y:520, size:12});
  const bytes = await doc.save();
  let t = nodemailer.createTransport(smtp);
  await t.sendMail({
    from: smtp.auth.user,
    to,
    subject: 'Invoice ESTR-'+new Date().toISOString().slice(0,10),
    attachments: [{filename:'invoice.pdf', content:bytes}]
  });
  res.json({ok:true});
});

app.listen(3000);
