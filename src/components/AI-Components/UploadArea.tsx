"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, Settings, X, CheckCircle, File as FileIcon, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useSessionStore } from "@/store/useSessionStore";
import { showToast } from "@/components/ui/CustomToast";
import { useSessionOrchestrator } from "@/hooks/useSessionOrchestrator";

interface UploadAreaProps {
    onFilesSelected?: (files: { source: File | null; schema: File | null }) => void;
    onStartIngestion?: () => void;
}

type ZoneType = "source" | "schema";

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected, onStartIngestion }) => {
    const { setSourceFile, setSchemaFile, sourceFile: sessionSource, schemaFile: sessionSchema, sessionStatus } = useSessionStore();
    const { startIngestion } = useSessionOrchestrator();

    // Local loading states
    const [isUploadingSource, setIsUploadingSource] = useState(false);
    const [isUploadingSchema, setIsUploadingSchema] = useState(false);

    const [sourceError, setSourceError] = useState<string | null>(null);
    const [schemaError, setSchemaError] = useState<string | null>(null);

    // Initialize state from session store if available (optional, depends on UX preference)
    // For now, we keep local file references separate from uploaded metadata
    // but we can check sessionSource to show "uploaded" state immediately if we wanted implementation complexity.

    const [sourceFileLocal, setSourceFileLocal] = useState<File | null>(null);
    const [schemaFileLocal, setSchemaFileLocal] = useState<File | null>(null);

    // Drag states
    const [dragActiveZone, setDragActiveZone] = useState<ZoneType | null>(null);

    const sourceInputRef = useRef<HTMLInputElement>(null);
    const schemaInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File, type: ZoneType): string | null => {
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (type === "source") {
            if (!['pdf', 'csv', 'xlsx', 'json', 'parquet', 'geojson', 'gpkg'].includes(ext || '')) {
                return "Invalid Format: Source requires data format (PDF, CSV, XLSX, JSON, etc.)";
            }
        } else {
            // Matching the subtext from the UI update
            if (!['json', 'parquet', 'csv', 'xlsx', 'geojson', 'gpkg'].includes(ext || '')) {
                return "Invalid Format: Schema requires valid data format.";
            }
        }

        if (file.size > 100 * 1024 * 1024) return "File exceeds 100MB limit."; // Updated to 100MB per UI text

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
                showToast.success("Source Uploaded", `${file.name} ready for processing.`);
            } else {
                setSourceFileLocal(null); // Reset local if upload failed
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
                showToast.success("Schema Uploaded", `${file.name} ready for processing.`);
            } else {
                setSchemaFileLocal(null);
            }
        }
    };

    const handleDrag = useCallback((e: React.DragEvent, zone: ZoneType) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActiveZone(zone);
        } else if (e.type === "dragleave") {
            setDragActiveZone(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, zone: ZoneType) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveZone(null);

        const droppedFiles = Array.from(e.dataTransfer.files);
        if (!droppedFiles.length) return;

        const file = droppedFiles[0]; // Take only the first file
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
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, zone: ZoneType) => {
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
            setSourceFile(null); // Clear from store
        } else {
            setSchemaFileLocal(null);
            setSchemaError(null);
            setSchemaFile(null); // Clear from store
        }
    };

    const isReady = !!sessionSource && !!sessionSchema && !isUploadingSource && !isUploadingSchema;
    const isProcessing = sessionStatus === 'PROCESSING';

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ZONE 1: Source Dataset */}
                <UploadZone
                    type="source"
                    file={sourceFileLocal}
                    isLoading={isUploadingSource}
                    error={sourceError}
                    isDragActive={dragActiveZone === 'source'}
                    onDrag={(e) => handleDrag(e, 'source')}
                    onDrop={(e) => handleDrop(e, 'source')}
                    onClick={() => sourceInputRef.current?.click()}
                    onRemove={() => removeFile('source')}
                    inputRef={sourceInputRef as React.RefObject<HTMLInputElement>}
                    onInputChange={(e) => handleFileInput(e, 'source')}
                    accept=".pdf,.csv,.xlsx"
                />

                {/* ZONE 2: Constraint Schema */}
                <UploadZone
                    type="schema"
                    file={schemaFileLocal}
                    isLoading={isUploadingSchema}
                    error={schemaError}
                    isDragActive={dragActiveZone === 'schema'}
                    onDrag={(e) => handleDrag(e, 'schema')}
                    onDrop={(e) => handleDrop(e, 'schema')}
                    onClick={() => schemaInputRef.current?.click()}
                    onRemove={() => removeFile('schema')}
                    inputRef={schemaInputRef as React.RefObject<HTMLInputElement>}
                    onInputChange={(e) => handleFileInput(e, 'schema')}
                    accept=".json,.yaml,.xml"
                />

            </div>

            {/* Action Button */}
            <div className="flex justify-center">
                <button
                    disabled={!isReady || isProcessing}
                    onClick={startIngestion}
                    className={cn(
                        "px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 w-full md:w-auto min-w-[300px]",
                        (isReady && !isProcessing)
                            ? "bg-[#5c1427] text-white shadow-lg hover:bg-[#7a1b34] hover:shadow-xl hover:scale-105"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                    )}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> Processing Session...
                        </span>
                    ) : isReady ? "Initialize Ingestion Sequence" : "Awaiting Uploads..."}
                </button>
            </div>

        </div>
    );
};


// Sub-component for a single Zone to keep things clean
interface UploadZoneProps {
    type: ZoneType;
    file: File | null;
    isLoading?: boolean;
    error: string | null;
    isDragActive: boolean;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
    type, file, isLoading, error, isDragActive, onDrag, onDrop, onClick, onRemove, inputRef, onInputChange, accept
}) => {

    const isSource = type === 'source';
    const title = isSource ? "Resources Dataset (Agent, Staff, etc.)" : "Target Dataset (Tasks, Facilities, etc.)";
    const subText = isSource ? "Supported: .json, .parquet, .csv, .xlsx, .geojson, .gpkg (Max 100MB)" : "Supported: .json, .parquet, .csv, .xlsx, .geojson, .gpkg (Max 100MB)";
    const Icon = isSource ? FileSpreadsheet : Settings;

    return (
        <div className="relative group flex-1 h-full min-h-[300px]">
            {/* Gradient Glow */}
            <div className={cn(
                "absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-20 transition duration-500",
                error ? "from-red-500 to-red-600 opacity-50" : "from-[#5c1427] to-[#8a243f] group-hover:opacity-40"
            )}></div>

            <div
                className={cn(
                    "relative h-full bg-[#1E1E1E] rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col items-center justify-between text-center",
                    error ? "border-red-500" : (isDragActive || file ? "border-[#5c1427] bg-[#5c1427]/5" : "border-gray-800 hover:border-[#5c1427]/30")
                )}
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={onInputChange}
                    accept={accept}
                />

                {/* Header Section */}
                <div className="w-full flex flex-col items-center pt-4">
                    <div className={cn(
                        "p-4 rounded-full mb-4 transition-colors",
                        file ? "bg-[#5c1427] text-white" : "bg-[#2A2A2A] text-gray-400 group-hover:text-[#5c1427]"
                    )}>
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : file ? (
                            <CheckCircle className="w-8 h-8" />
                        ) : (
                            <Icon className="w-8 h-8" />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-xs text-gray-500 font-mono">
                        {isLoading ? "Uploading..." : (isSource ? "Upload Invoice or Raw CSV" : "Upload Optimization Targets")}
                    </p>
                </div>

                {/* Middle Section: Drop Area or File Info */}
                <div className="flex-1 flex items-center justify-center w-full my-6">
                    {file ? (
                        <div className="bg-[#2A2A2A] w-full p-4 rounded-lg flex items-center justify-between border border-gray-700">
                            <div className="flex items-center gap-3 overflow-hidden text-left">
                                <FileIcon className="w-8 h-8 text-[#5c1427] flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-white truncate max-w-[150px]">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={onClick}
                            className={cn(
                                "w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all",
                                error ? "border-red-500/50 bg-red-500/5" : "border-gray-700 bg-[#252525] hover:border-[#5c1427]/50 hover:bg-[#5c1427]/5"
                            )}>
                            {error ? (
                                <div className="flex flex-col items-center text-red-400 px-4">
                                    <AlertCircle className="w-6 h-6 mb-2" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-500 mb-2 group-hover:text-[#5c1427] transition-colors" />
                                    <p className="text-sm text-gray-400">Drag & drop file here</p>
                                    <span className="text-xs text-[#5c1427] mt-1 hover:underline">or browse local drive</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Section: Supported Formats */}
                <div className="w-full border-t border-gray-800 pt-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">{subText}</p>
                </div>

            </div>
        </div>
    );
}

export default UploadArea;
