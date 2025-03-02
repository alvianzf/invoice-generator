import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/Tabs";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";
import { FileText, Eye } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 shadow-sm py-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-white" />
          <h1 className="text-2xl font-bold text-white">
            Invoice Generator
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Use Tabs instead of manually managing state */}
          <Tabs defaultValue="form">
            <TabsList className="flex border-b border-gray-700">
              <TabsTrigger
                value="form"
                className="flex items-center gap-2 px-6 py-3"
              >
                <FileText size={18} />
                Create Invoice
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex items-center gap-2 px-6 py-3"
              >
                <Eye size={18} />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="p-4">
              <InvoiceForm />
            </TabsContent>
            <TabsContent value="preview" className="p-4">
              <InvoicePreview />
            </TabsContent>
          </Tabs>
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
