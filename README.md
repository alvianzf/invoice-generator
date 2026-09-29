# 🧾 Invoice Generator for Contractors & Freelancers  

![Main Screenshot](images/main.png)  

> Because doing invoices manually is so 2010.  

Are you tired of manually creating invoices like it's the medieval era? **This Invoice Generator** is here to save your precious freelancer time so you can focus on **procrastinating working on your real projects.**  

---

## 🎬 Preview  

Behold, the futuristic invoice generator in action:  

![Invoice Preview](images/preview.png)  

---

## 🚀 Features  

✅ **Generate Professional Invoices** – Because clients don’t take crayon-written invoices seriously.  
✅ **Preview = PDF** – The live preview and the download come from one layout engine, same fonts, same line breaks, same page breaks.  
✅ **Long Content Handled** – Descriptions and addresses wrap; long tables continue on the next page with repeated headers and page numbers.  
✅ **Auto-Sum & Multi-Currency** – IDR, USD, EUR, GBP, SGD, AUD, MYR, JPY, each in its local number format.  
✅ **Speaks Slovak (and friends)** – Embedded Unicode font, so `č ľ ť ő ß` don’t turn into garbage.  
✅ **Private** – Everything stays in your browser’s localStorage. No server, no analytics.  
✅ **100% Free** – Until I figure out how to charge you for it.  

---


## 🖼 How to Use

1. Fill in your invoice details (be honest, or don’t, I’m not your accountant)
2. Click **Generate Invoice**
3. Download the **PDF**
4. Send it to your client and wait for the sweet, sweet payment

---

## 🛠️ Tech Stack  

Because real devs love fancy logos:  

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)  
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)  
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)  
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)  

Under the hood: **jsPDF** with embedded Inter + Instrument Serif fonts. `src/pdf/layout.ts` measures and wraps text with the real font metrics and paginates into drawing ops; `src/pdf/engine.ts` writes those ops to the PDF, and `src/components/PdfPreview.tsx` draws the very same ops as SVG.

**Bonus:**  
- No jQuery (You're welcome.)  
- No AI-generated spaghetti code (I think.)  
- No tracking pixels (You’re not that interesting.)  

---

## 🏗️ Installation  

For the rare few who read docs before running random commands:  

```sh
git clone https://github.com/alvianzf/invoice-generator.git
cd invoice-generator
npm install
npm run dev
```
Boom! You’re in business.

Pushes to `main` deploy automatically to [invoice.alvianzf.id](https://invoice.alvianzf.id) via GitHub Actions.

---


## 📜 License
MIT – because I’m generous.

---


## 🔗 Connect with Me

[![GitHub](https://img.shields.io/badge/GitHub-000?style=for-the-badge&logo=github)](https://github.com/alvianzf)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/alvianzf)


Give it a star ⭐ or I will send you a paper invoice.

---

🚨 **Disclaimer:** This tool won’t magically make clients pay you on time. Use at your own risk. 😉
