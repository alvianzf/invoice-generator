import { useEffect, useState } from "react";
import { InvoiceData } from "../types";

const InvoicePreview = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("invoiceGeneratorData");
    if (storedData) {
      setInvoiceData(JSON.parse(storedData));
    }
  }, []);

  if (!invoiceData) {
    return <p>Loading invoice preview...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-red-700 text-center">INVOICE</h2>
        <p className="text-gray-600">No: {invoiceData.invoiceNumber}</p>
        <p className="text-gray-600">Date: {invoiceData.invoiceDate}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4 text-black">
        <div>
          <h3 className="text-lg font-bold">Billed To:</h3>
          <p>{invoiceData.billedToCompanyName}</p>
          <p>{invoiceData.billedToAddress}</p>
          <p>Company ID: {invoiceData.billedToCompanyId}</p>
          <p>VAT: {invoiceData.billedToVat}</p>
        </div>

        <div>
          <h3 className="text-lg font-bold">From:</h3>
          <p>{invoiceData.fromName || "-"}</p>
          <p>{invoiceData.fromAddress || "-"}</p>
          <p>VAT: {invoiceData.fromVat || "-"}</p>
        </div>
      </div>

      <table className="w-full mt-6 border-collapse border border-gray-300">
        <thead className="bg-red-700 text-white">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
            <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Price
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="text-black">
          {invoiceData.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="border border-gray-300 px-4 py-2">
                {item.description}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {item.quantity}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {item.price}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right">
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <div className="text-right">
          <p className="text-lg font-bold">Total:</p>
          <p className="text-xl font-bold text-red-700">
            {invoiceData.items
              .reduce((sum, item) => {
                const amount = Number(item.amount.replace(/\D/g, ""));
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0)
              .toLocaleString("id-ID", { style: "currency", currency: "IDR" })
              .replace("Rp", "IDR")}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t pt-4 text-black">
        <h3 className="text-lg font-bold">Payment Details:</h3>
        <p>Bank Name: {invoiceData.bankName || "-"}</p>
        <p>Account Name: {invoiceData.accountName || "-"}</p>
        <p>Account Number: {invoiceData.accountNumber || "-"}</p>
        <p>Swift Code: {invoiceData.swiftCode || "-"}</p>
      </div>

      <div className="mt-4 text-sm text-gray-600 italic">
        <p>
          * For inquiries, contact{" "}
          {invoiceData.contactEmail || "your-email@example.com"} or{" "}
          {invoiceData.contactPhone || "your-phone-number"}.
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
