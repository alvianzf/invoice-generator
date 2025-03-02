import React from "react";
import { InvoiceData } from "../types";

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoiceData }) => {
  // Calculate total
  const total = invoiceData.items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.price.toString().replace(/[^0-9.-]+/g, "")); // Remove commas before parsing
    const amount = isNaN(quantity) || isNaN(price) ? 0 : quantity * price;
    return sum + amount;
  }, 0);

  return (
    <div className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto border border-gray-200">
      <div className="bg-gray-50 -m-8 p-8 mb-8 border-b border-gray-200">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-700 font-medium">
              NO: {invoiceData.invoiceNumber}
            </p>
            <p className="text-gray-700">Date: {invoiceData.invoiceDate}</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-800 uppercase">INVOICE</h1>
        <div className="w-24 h-1 bg-blue-800 mx-auto mt-2"></div>
      </div>

      {/* Client and Sender Info */}
      <div className="flex justify-between mb-12">
        <div className="w-1/2 pr-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">
            Billed to:
          </h2>
          <p className="font-medium">{invoiceData.billedToCompanyName}</p>
          <p className="text-gray-600">{invoiceData.billedToAddress}</p>
          <p className="text-gray-600">
            Company ID: {invoiceData.billedToCompanyId}
          </p>
          <p className="text-gray-600">VAT: {invoiceData.billedToVat}</p>
        </div>

        <div className="w-1/2 pl-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">From:</h2>
          <p className="font-medium">{invoiceData.fromName}</p>
          <p className="text-gray-600">{invoiceData.fromAddress}</p>
          <p className="text-gray-600">VAT: {invoiceData.fromVat}</p>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border border-blue-700 px-4 py-3 text-left rounded-tl-md">
                Item
              </th>
              <th className="border border-blue-700 px-4 py-3 text-right">
                Quantity
              </th>
              <th className="border border-blue-700 px-4 py-3 text-right">
                Price
              </th>
              <th className="border border-blue-700 px-4 py-3 text-right rounded-tr-md">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="border border-gray-200 px-4 py-3">
                  {item.description}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right">
                  {item.quantity}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right">
                  {item.price}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-right">
                  {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="border border-gray-200"></td>
              <td className="border border-gray-200 px-4 py-3 text-right font-bold bg-gray-100">
                Total
              </td>
              <td className="border border-gray-200 px-4 py-3 text-right font-bold bg-gray-100">
                IDR {total.toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Details */}
      <div className="mb-8 bg-gray-50 p-5 rounded-md">
        <h2 className="text-lg font-semibold mb-3 text-blue-800 border-b border-blue-200 pb-1">
          Payment Details
        </h2>
        <div className="grid grid-cols-2 gap-y-2">
          <div className="flex">
            <p className="font-semibold w-32">Bank:</p>
            <p>{invoiceData.bankName}</p>
          </div>

          <div className="flex">
            <p className="font-semibold w-32">Account Number:</p>
            <p>{invoiceData.accountNumber}</p>
          </div>

          <div className="flex">
            <p className="font-semibold w-32">Account Name:</p>
            <p>{invoiceData.accountName}</p>
          </div>

          <div className="flex">
            <p className="font-semibold w-32">Swift Code:</p>
            <p>{invoiceData.swiftCode}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-100 p-3 rounded-md text-center">
        <p className="text-sm text-gray-600 italic">
          For inquiries: {invoiceData.contactEmail} | {invoiceData.contactPhone}
        </p>
      </div>
    </div>
  );
};

export default InvoicePreview;
