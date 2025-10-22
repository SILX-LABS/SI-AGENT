'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal,
  Folder,
  File
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified?: string;
}

export default function Sidebar() {
  const [files] = useState<FileItem[]>([
    { id: '1', name: 'Project Overview.md', type: 'file', size: '2.4 KB', modified: '2 hours ago' },
    { id: '2', name: 'API Documentation', type: 'folder', modified: '1 day ago' },
    { id: '3', name: 'Backend Setup.txt', type: 'file', size: '1.2 KB', modified: '3 hours ago' },
    { id: '4', name: 'Frontend Components', type: 'folder', modified: '5 hours ago' },
    { id: '5', name: 'Database Schema.sql', type: 'file', size: '3.8 KB', modified: '1 day ago' },
  ]);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Project Files
          </h2>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFile(file.id)}
              className={`group flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                selectedFile === file.id
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex-shrink-0 mr-2">
                {file.type === 'folder' ? (
                  <Folder className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.name}
                </p>
                {file.size && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.size} • {file.modified}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{files.length} files</span>
          <span>2.1 MB used</span>
        </div>
      </div>
    </div>
  );
}
