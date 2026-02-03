"use client";

import React, { useState, useRef } from "react";
import { X, CheckCircle2, File as FileIcon, Loader2, Sparkles, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/useSessionStore";
import { useSessionOrchestrator } from "@/hooks/useSessionOrchestrator";
import { motion } from "framer-motion";

interface UploadAreaProps {
    onFilesSelected?: (files: { source: File | null; schema: File | null }) => void;
    onStartIngestion?: () => void;
}

type ZoneType = "source" | "schema";

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, onStartIngestion }) => {
    // We only use store for status checking, not for file storage anymore in this phase
    const { sessionStatus } = useSessionStore();
    const { startIngestion } = useSessionOrchestrator();

    const [sourceError, setSourceError] = useState<string | null>(null);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    const [sourceFileLocal, setSourceFileLocal] = useState<File | null>(null);
    const [schemaFileLocal, setSchemaFileLocal] = useState<File | null>(null);

    const sourceInputRef = useRef<HTMLInputElement>(null);
    const schemaInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File, type: ZoneType): string | null => {
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (type === "source") {
            if (!['pdf', 'csv', 'xlsx', 'json', 'parquet', 'geojson', 'gpkg'].includes(ext || '')) {
                return "Invalid Format. Support: CSV, XLSX, JSON, Parquet, etc.";
            }
        } else {
            if (!['json', 'parquet', 'csv', 'xlsx', 'geojson', 'gpkg'].includes(ext || '')) {
                return "Invalid Format. Schema requires data format.";
            }
        }
        if (file.size > 100 * 1024 * 1024) return "File exceeds 100MB limit.";
        return null;
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, zone: ZoneType) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = validateFile(file, zone);

            if (zone === "source") {
                setSourceError(error);
                if (!error) {
                    setSourceFileLocal(file);
                }
            } else {
                setSchemaError(error);
                if (!error) {
                    setSchemaFileLocal(file);
                }
            }
        }
    };

    const removeFile = (zone: ZoneType) => {
        if (zone === "source") {
            setSourceFileLocal(null);
            setSourceError(null);
            if (sourceInputRef.current) sourceInputRef.current.value = '';
        } else {
            setSchemaFileLocal(null);
            setSchemaError(null);
            if (schemaInputRef.current) schemaInputRef.current.value = '';
        }
    };

    const handleStart = () => {
        if (sourceFileLocal) {
            startIngestion(sourceFileLocal, schemaFileLocal);
        }
    };

    const isReady = !!sourceFileLocal;
    const isProcessing = sessionStatus === 'PROCESSING';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">

            {/* Main Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl flex flex-col items-center text-center space-y-10"
            >
                {/* Header / Greeting */}
                <div className="space-y-6">
                    <div className="inline-flex items-center justify-center p-4 bg-white shadow-sm border border-gray-100 rounded-2xl mb-4">
                        <Sparkles className="w-8 h-8 text-gray-900" />
                    </div>
                    <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        What can I help you optimize?
                    </h1>
                </div>

                {/* Upload Section - Cleaner, Stacked or Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Source File Input */}
                    <MinimalUploadCard
                        label="Source Dataset"
                        subtext="CSV, Excel, JSON"
                        file={sourceFileLocal}
                        isLoading={false}
                        error={sourceError}
                        onClick={() => sourceInputRef.current?.click()}
                        onRemove={() => removeFile('source')}
                    />
                    <input ref={sourceInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'source')} accept=".csv,.xlsx,.json,.parquet" />

                    {/* Schema File Input */}
                    <MinimalUploadCard
                        label="Constraint Schema"
                        subtext="JSON, YAML"
                        file={schemaFileLocal}
                        isLoading={false}
                        error={schemaError}
                        onClick={() => schemaInputRef.current?.click()}
                        onRemove={() => removeFile('schema')}
                    />
                    <input ref={schemaInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'schema')} accept=".json,.yaml" />

                </div>

                {/* Action Area */}
                <div className="w-full pt-8 flex justify-center">
                    <button
                        onClick={handleStart}
                        disabled={!isReady || isProcessing}
                        className={cn(
                            "group relative px-6 py-3 rounded-xl font-medium text-white shadow-sm transition-all duration-200 flex items-center gap-2 overflow-hidden",
                            (isReady && !isProcessing)
                                ? "bg-black hover:bg-gray-800"
                                : "bg-gray-200 cursor-not-allowed text-gray-400"
                        )}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <span>Initialize Session</span>
                                <div className="bg-white/20 p-1 rounded-md">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                            </>
                        )}
                    </button>
                </div>

            </motion.div>

        </div>
    );
};

// Reusable Minimal Card
const MinimalUploadCard = ({ label, subtext, file, isLoading, error, onClick, onRemove }: any) => {
    return (
        <div
            onClick={!file ? onClick : undefined}
            className={cn(
                "relative group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-200 cursor-pointer min-h-[160px]",
                file
                    ? "bg-white border-gray-200 shadow-sm"
                    : "bg-white border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50/50",
                error && "border-red-300 bg-red-50/10"
            )}
        >
            {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Uploading...</span>
                </div>
            ) : file ? (
                <div className="w-full flex flex-col items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute -top-3 -right-3 p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3 group-hover:scale-110 transition-transform">
                        <Paperclip className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{subtext}</p>
                    {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
                </>
            )}
        </div>
    );
}

export default UploadArea;
