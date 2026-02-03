import React from 'react';
import { useSessionStore, FileMetadata, DatasetMetadata } from '@/store/useSessionStore';
import { Database, FileJson, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const FileRow: React.FC<{
    label: string;
    file: FileMetadata | null;
    metadata: DatasetMetadata | null;
    icon: React.ReactNode;
}> = ({ label, file, metadata, icon }) => {
    if (!file) return null;

    const fileSize = file.meta?.size
        ? (file.meta.size / 1024 / 1024).toFixed(2) + ' MB'
        : file.size
            ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
            : 'Unknown';

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group">
            <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-black transition-colors">
                    {icon}
                </div>

                {/* File Details */}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{file.originalName || label}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{fileSize}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="uppercase">{file.format || file.meta?.mimeType?.split('/')[1] || 'FILE'}</span>
                    </div>
                </div>
            </div>

            {/* Metadata Stats / Status */}
            <div className="flex items-center gap-6">
                {metadata && (
                    <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <span>{metadata.count?.toLocaleString() || 0} Rows</span>
                        <span className="w-[1px] h-3 bg-gray-300" />
                        <span>{metadata.columns?.length || 0} Columns</span>
                    </div>
                )}

                <div className="flex flex-col items-end text-right">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                    </div>
                    {file.createdAt && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UploadedFilesStep = () => {
    const { sourceFile, schemaFile, resourcesMetadata, targetsMetadata } = useSessionStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Data Assets</h3>
                {/* Optional: Add 'Re-upload' action here if needed */}
            </div>

            <div className="space-y-3">
                <FileRow
                    label="Resource Dataset"
                    file={sourceFile}
                    metadata={resourcesMetadata}
                    icon={<Database className="w-5 h-5" />}
                />
                <FileRow
                    label="Constraint Schema"
                    file={schemaFile}
                    metadata={targetsMetadata}
                    icon={<FileJson className="w-5 h-5" />}
                />
            </div>
        </motion.div>
    );
};

export default UploadedFilesStep;
