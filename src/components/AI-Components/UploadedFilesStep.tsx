import React, { useState } from 'react';
import { useSessionStore, FileMetadata, DatasetMetadata } from '@/store/useSessionStore';
import { Database, FileJson, CheckCircle2, Clock, ChevronDown, ChevronUp, Hash, Type, ToggleLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── Column type icon ─────────────────────────────────────────────────────────
const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
    const t = type?.toLowerCase() ?? '';
    if (t.includes('int') || t.includes('float') || t.includes('num') || t.includes('double'))
        return <Hash className="w-3 h-3 text-blue-400" />;
    if (t.includes('bool'))
        return <ToggleLeft className="w-3 h-3 text-green-400" />;
    return <Type className="w-3 h-3 text-gray-400" />;
};

// ─── Column table ─────────────────────────────────────────────────────────────
const ColumnTable: React.FC<{ columns: string[] }> = ({ columns }) => (
    <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
            <span key={col} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-700">
                {col}
            </span>
        ))}
    </div>
);

// ─── Dataset card ─────────────────────────────────────────────────────────────
const DatasetCard: React.FC<{
    label: string;
    file: FileMetadata | null;
    metadata: DatasetMetadata | null;
    icon: React.ReactNode;
    accent: string;
}> = ({ label, file, metadata, icon, accent }) => {
    const [expanded, setExpanded] = useState(false);

    const fileSize = file?.size
        ? ((file.size as number) / 1024 / 1024).toFixed(2) + ' MB'
        : null;

    const hasData = metadata && metadata.columns && metadata.columns.length > 0;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div
                className={cn('flex items-center justify-between p-5 cursor-pointer', hasData && 'hover:bg-gray-50/50 transition-colors')}
                onClick={() => hasData && setExpanded(e => !e)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0', accent)}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">
                            {file?.originalName ?? label}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {fileSize && <span>{fileSize}</span>}
                            {fileSize && metadata && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                            {metadata && (
                                <span>
                                    {metadata.count?.toLocaleString() ?? 0} rows · {metadata.columns?.length ?? 0} columns
                                </span>
                            )}
                            {!metadata && !file && <span className="text-gray-400 italic">No data uploaded</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {file && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready</span>
                        </div>
                    )}
                    {hasData && (
                        <div className="text-gray-400 p-1">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable column details */}
            <AnimatePresence>
                {expanded && hasData && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                    >
                        {/* Preview rows if available */}
                        <div className="px-5 pt-4 pb-5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Schema · {metadata!.columns.length} columns
                            </p>
                            <ColumnTable columns={metadata!.columns} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
const UploadedFilesStep = () => {
    const { sourceFile, schemaFile, resourcesMetadata, targetsMetadata } = useSessionStore();

    const hasAnyData = sourceFile || schemaFile || resourcesMetadata || targetsMetadata;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto px-6 py-8"
        >
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Data Assets</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Uploaded datasets and their schema. Click a card to inspect columns and sample values.
                </p>
            </div>

            {!hasAnyData ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                        <Database className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No data uploaded yet</p>
                    <p className="text-gray-400 text-xs max-w-xs">
                        Upload a resource and target dataset from the home page to get started.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <DatasetCard
                        label="Resource Dataset"
                        file={sourceFile}
                        metadata={resourcesMetadata}
                        icon={<Database className="w-5 h-5" />}
                        accent="bg-blue-500"
                    />
                    <DatasetCard
                        label="Target Dataset"
                        file={schemaFile}
                        metadata={targetsMetadata}
                        icon={<FileJson className="w-5 h-5" />}
                        accent="bg-violet-500"
                    />
                </div>
            )}
        </motion.div>
    );
};

export default UploadedFilesStep;
