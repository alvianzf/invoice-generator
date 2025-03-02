import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs';
import InvoiceForm from './components/InvoiceForm';
import { FileText, Eye } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<string>('form');
  
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 shadow-sm py-4 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white">Invoice Generator</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-700">
            <button
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium ${
                activeTab === 'form' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-300 hover:text-gray-100'
              }`}
              onClick={() => setActiveTab('form')}
            >
              <FileText size={18} />
              Create Invoice
            </button>
          </div>
          
          <div className="p-4">
            <InvoiceForm />
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-900 border-t border-gray-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-400 text-sm">
            Invoice Generator App © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;