import express from 'express';
import nodemailer from 'nodemailer';
import { PDFDocument, rgb } from 'pdf-lib';
import fetch from 'node-fetch';

const app=express();
app.use(express.json({limit:'10mb'}));

app.post('/cafe',async(req,res)=>{
  try{
    const {cliente,items,totalUSD,totalMXN,to,smtp}=req.body;
    const template=await fetch('https://estrategikmente.com/template.pdf').then(r=>r.arrayBuffer());
    const pdfDoc=await PDFDocument.load(template);
    const page=pdfDoc.getPage(0);
    const font=await pdfDoc.embedFont('Helvetica');
    const fontBold=await pdfDoc.embedFont('Helvetica-Bold');

    // COORDENADAS 100 % IGUALES A TU PDF #111
    page.drawText(cliente,{x:170,y:620,size:12,font:fontBold});
    page.drawText(`$${totalUSD}`,{x:170,y:595,size:12,font});
    page.drawText(`$${totalMXN}`,{x:170,y:570,size:12,font});

    let y=480;
    items.forEach(it=>{
      page.drawText(it.qty,{x:50,y,size:11,font});
      page.drawText(it.desc,{x:100,y,size:11,font});
      page.drawText(`$${it.price}`,{x:350,y,size:11,font});
      page.drawText(`$${it.amount}`,{x:450,y,size:11,font});
      y-=20;
    });

    const pdfBytes=await pdfDoc.save();
    const transporter=nodemailer.createTransport(smtp);
    await transporter.sendMail({
      from:smtp.auth.user,
      to:to,
      subject:`Factura CAPOP #CAP-2025-111 - ${cliente}`,
      text:'Factura adjunta',
      attachments:[{filename:'CAPOP-INVOICE.pdf',content:pdfBytes}]
    });

    res.json({ok:true});
  }catch(e){
    console.log(e);
    res.json({ok:false,error:e.message});
  }
});

app.listen(process.env.PORT||3000);
