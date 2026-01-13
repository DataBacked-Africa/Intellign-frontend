"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, Settings, X, CheckCircle2, File as FileIcon, Loader2, Sparkles, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useSessionStore } from "@/store/useSessionStore";
import { showToast } from "@/components/ui/CustomToast";
import { useSessionOrchestrator } from "@/hooks/useSessionOrchestrator";
import { motion, AnimatePresence } from "framer-motion";

interface UploadAreaProps {
    onFilesSelected?: (files: { source: File | null; schema: File | null }) => void;
    onStartIngestion?: () => void;
}

type ZoneType = "source" | "schema";

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, onStartIngestion }) => {
    const { setSourceFile, setSchemaFile, sourceFile: sessionSource, schemaFile: sessionSchema, sessionStatus, setStatus } = useSessionStore();
    const { startIngestion } = useSessionOrchestrator();

    // Local loading states
    const [isUploadingSource, setIsUploadingSource] = useState(false);
    const [isUploadingSchema, setIsUploadingSchema] = useState(false);

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

    const handleUpload = async (file: File, zone: ZoneType) => {
        if (zone === "source") {
            setIsUploadingSource(true);
            const data = await uploadToCloudinary(file);
            setIsUploadingSource(false);

            if (data) {
                setSourceFile({
                    url: data.secure_url,
                    publicId: data.public_id,
                    originalName: data.original_filename,
                    format: data.format,
                    size: data.bytes,
                    createdAt: data.created_at
                });
                showToast.success("Source Attached", `${file.name} ready.`);
            } else {
                setSourceFileLocal(null);
            }
        } else {
            setIsUploadingSchema(true);
            const data = await uploadToCloudinary(file);
            setIsUploadingSchema(false);

            if (data) {
                setSchemaFile({
                    url: data.secure_url,
                    publicId: data.public_id,
                    originalName: data.original_filename,
                    format: data.format,
                    size: data.bytes,
                    createdAt: data.created_at
                });
                showToast.success("Schema Attached", `${file.name} ready.`);
            } else {
                setSchemaFileLocal(null);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, zone: ZoneType) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = validateFile(file, zone);

            if (zone === "source") {
                setSourceError(error);
                if (!error) {
                    setSourceFileLocal(file);
                    handleUpload(file, 'source');
                }
            } else {
                setSchemaError(error);
                if (!error) {
                    setSchemaFileLocal(file);
                    handleUpload(file, 'schema');
                }
            }
        }
    };

    const removeFile = (zone: ZoneType) => {
        if (zone === "source") {
            setSourceFileLocal(null);
            setSourceError(null);
            setSourceFile(null);
        } else {
            setSchemaFileLocal(null);
            setSchemaError(null);
            setSchemaFile(null);
        }
    };

    const isReady = !!sessionSource && !!sessionSchema && !isUploadingSource && !isUploadingSchema;
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
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full mb-2">
                        <Sparkles className="w-6 h-6 text-[#5c1427]" />
                    </div>
                    <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
                        Start your optimization
                    </h1>
                    <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
                        Upload your source data and constraint schema to initialize the AI analysis model.
                    </p>
                </div>

                {/* Upload Section - Cleaner, Stacked or Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Source File Input */}
                    <MinimalUploadCard
                        label="Source Dataset"
                        subtext="CSV, Excel, JSON"
                        file={sourceFileLocal}
                        isLoading={isUploadingSource}
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
                        isLoading={isUploadingSchema}
                        error={schemaError}
                        onClick={() => schemaInputRef.current?.click()}
                        onRemove={() => removeFile('schema')}
                    />
                    <input ref={schemaInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'schema')} accept=".json,.yaml" />

                </div>

                {/* Action Area */}
                <div className="w-full pt-4">
                    <button
                        onClick={startIngestion}
                        disabled={!isReady || isProcessing}
                        className={cn(
                            "group relative w-full md:w-auto px-8 py-3 rounded-full font-medium text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto overflow-hidden",
                            (isReady && !isProcessing)
                                ? "bg-[#5c1427] hover:bg-[#7a1b34]"
                                : "bg-gray-300 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyzing Data...</span>
                            </>
                        ) : (
                            <>
                                <span>Initialize Session</span>
                                <Sparkles className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </>
                        )}
                    </button>
                    {isReady && !isProcessing && (
                        <p className="text-xs text-gray-400 mt-4 animate-in fade-in">
                            Ready to process {(sourceFileLocal?.size || 0) / 1024 > 1024 ? `${((sourceFileLocal?.size || 0) / 1024 / 1024).toFixed(1)} MB` : `${((sourceFileLocal?.size || 0) / 1024).toFixed(1)} KB`} of data.
                        </p>
                    )}
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
