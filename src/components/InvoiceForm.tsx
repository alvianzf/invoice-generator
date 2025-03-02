import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, FileText, RefreshCw, Calendar } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const initialItem: InvoiceItem = {
  id: uuidv4(),
  description: '',
  quantity: '',
  price: '',
  amount: ''
};

const initialInvoiceData: InvoiceData = {
  invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
  invoiceDate: new Date().toISOString().split('T')[0],
  
  // Billed To
  billedToCompanyName: '',
  billedToAddress: '',
  billedToCompanyId: '',
  billedToVat: '',
  
  // From
  fromName: '',
  fromAddress: '',
  fromVat: '',
  
  // Items
  items: [{ ...initialItem }],
  
  // Payment Details
  bankName: '',
  accountName: '',
  accountNumber: '',
  swiftCode: '',
  contactEmail: '',
  contactPhone: ''
};

const STORAGE_KEY = 'invoiceGeneratorData';

const InvoiceForm: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    // Load data from localStorage on initial render
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : initialInvoiceData;
  });
  
  // Save to localStorage whenever invoiceData changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoiceData));
  }, [invoiceData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
    setInvoiceData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate amount if quantity and price are set
          if ((field === 'quantity' || field === 'price') && updatedItem.quantity && updatedItem.price) {
            const quantity = parseFloat(updatedItem.quantity.replace(/[^0-9.-]+/g, ""));
            const price = parseFloat(updatedItem.price.replace(/[^0-9.-]+/g, ""));
            
            if (!isNaN(quantity) && !isNaN(price)) {
              const amount = quantity * price;
              updatedItem.amount = `IDR ${amount.toLocaleString('id-ID')}`;
            }
          }
          
          return updatedItem;
        }
        return item;
      });
      
      return { ...prev, items: updatedItems };
    });
  };
  
  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { ...initialItem, id: uuidv4() }]
    }));
  };
  
  const removeItem = (id: string) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };
  
  const generateRandomInvoiceNumber = () => {
    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };
  
  const setTodayDate = () => {
    setInvoiceData(prev => ({
      ...prev,
      invoiceDate: new Date().toISOString().split('T')[0]
    }));
  };
  
  const generatePDF = () => {
    const doc = generateInvoicePDF(invoiceData);
    doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">Invoice Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Invoice Details</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Number</label>
              <div className="flex">
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={handleInputChange}
                  className="flex-1 rounded-l-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={generateRandomInvoiceNumber}
                  className="bg-gray-600 border border-l-0 border-gray-600 rounded-r-md px-3 py-2 hover:bg-gray-500"
                  title="Generate Random Number"
                >
                  <RefreshCw size={16} className="text-gray-200" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Date</label>
              <div className="flex">
                <input
                  type="date"
                  name="invoiceDate"
                  value={invoiceData.invoiceDate}
                  onChange={handleInputChange}
                  className="flex-1 rounded-l-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={setTodayDate}
                  className="bg-gray-600 border border-l-0 border-gray-600 rounded-r-md px-3 py-2 hover:bg-gray-500"
                  title="Set Today's Date"
                >
                  <Calendar size={16} className="text-gray-200" />
                </button>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2 text-gray-200">Billed To</h3>
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
              <input
                type="text"
                name="billedToCompanyName"
                value={invoiceData.billedToCompanyName}
                onChange={handleInputChange}
                placeholder="e.g. Devshore Partners s.r.o."
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
              <input
                type="text"
                name="billedToAddress"
                value={invoiceData.billedToAddress}
                onChange={handleInputChange}
                placeholder="e.g. Námestie SNP 3, 811 06 Bratislava, Slovakia"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company ID</label>
              <input
                type="text"
                name="billedToCompanyId"
                value={invoiceData.billedToCompanyId}
                onChange={handleInputChange}
                placeholder="e.g. 53442474"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">VAT Number</label>
              <input
                type="text"
                name="billedToVat"
                value={invoiceData.billedToVat}
                onChange={handleInputChange}
                placeholder="e.g. SK2121378149"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-200">From</h2>
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                name="fromName"
                value={invoiceData.fromName}
                onChange={handleInputChange}
                placeholder="e.g. Alvian Zachry Faturrahman"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
              <input
                type="text"
                name="fromAddress"
                value={invoiceData.fromAddress}
                onChange={handleInputChange}
                placeholder="e.g. Sinar Indah Blok M5, Tebing, Kab Karimun"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">VAT Number</label>
              <input
                type="text"
                name="fromVat"
                value={invoiceData.fromVat}
                onChange={handleInputChange}
                placeholder="e.g. 74131185-214.000"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Payment Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={invoiceData.bankName}
                onChange={handleInputChange}
                placeholder="e.g. Bank Mandiri"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
              <input
                type="text"
                name="accountName"
                value={invoiceData.accountName}
                onChange={handleInputChange}
                placeholder="e.g. Alvian Zachry Faturrahman"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={invoiceData.accountNumber}
                onChange={handleInputChange}
                placeholder="e.g. 108001016216"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Swift Code</label>
              <input
                type="text"
                name="swiftCode"
                value={invoiceData.swiftCode}
                onChange={handleInputChange}
                placeholder="e.g. BMRIIDJA"
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={invoiceData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="e.g. alvian21@gmail.com"
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={invoiceData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="e.g. +6287848510004"
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Invoice Items</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-700">
              <th className="border border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-200">Description</th>
              <th className="border border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-200 w-32">Quantity</th>
              <th className="border border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-200 w-40">Price</th>
              <th className="border border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-200 w-40">Amount</th>
              <th className="border border-gray-600 px-4 py-2 text-center text-sm font-medium text-gray-200 w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item) => (
              <tr key={item.id} className="bg-gray-800">
                <td className="border border-gray-600 px-4 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="e.g. Recruitment Service"
                    className="w-full border-0 bg-transparent focus:outline-none focus:ring-0 text-sm text-white"
                  />
                </td>
                <td className="border border-gray-600 px-4 py-2">
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full border-0 bg-transparent focus:outline-none focus:ring-0 text-sm text-white"
                  />
                </td>
                <td className="border border-gray-600 px-4 py-2">
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                    placeholder="e.g. IDR 27.500.000"
                    className="w-full border-0 bg-transparent focus:outline-none focus:ring-0 text-sm text-white"
                  />
                </td>
                <td className="border border-gray-600 px-4 py-2">
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                    placeholder="e.g. IDR 27.500.000"
                    className="w-full border-0 bg-transparent focus:outline-none focus:ring-0 text-sm text-white"
                  />
                </td>
                <td className="border border-gray-600 px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-300"
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between mb-8">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 bg-blue-900 text-blue-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800"
        >
          <Plus size={16} /> Add Item
        </button>
        
        <div className="text-right">
          <p className="text-sm text-gray-400 mb-1">Total Amount:</p>
          <p className="text-xl font-bold text-white">
            IDR {invoiceData.items.reduce((sum, item) => {
              const amount = parseFloat(item.amount.replace(/[^0-9.-]+/g, ""));
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          type="button"
          onClick={generatePDF}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
        >
          <FileText size={20} /> Generate PDF Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;