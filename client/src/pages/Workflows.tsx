import React from 'react';
import { Settings, Plus } from 'lucide-react';

const Workflows: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600">Create and manage automated workflows</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      <div className="bg-white p-12 rounded-lg shadow text-center">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Automation</h3>
        <p className="text-gray-600 mb-4">
          Create workflows for document processing, translation, and data extraction
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Document Summary</h4>
            <p className="text-sm text-gray-600">Automatically summarize uploaded documents</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Language Translation</h4>
            <p className="text-sm text-gray-600">Translate between Amharic and English</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Data Extraction</h4>
            <p className="text-sm text-gray-600">Extract key information from documents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workflows; 