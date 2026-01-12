"use client"
import React from 'react';
import UploadArea from './UploadArea';
import ProcessingConsole from './ProcessingConsole';
import ResultsDashboard from './ResultsDashboard';
import { useSessionStore } from '@/store/useSessionStore';
import { ScanLine, Workflow, FileText } from 'lucide-react';

const HeroSection = () => {
    const { sessionStatus } = useSessionStore();
    const isIngesting = sessionStatus !== 'IDLE';

    return (
        <section className="relative w-full min-h-[calc(100vh-80px)] bg-[#F5F5F5] flex flex-col items-center justify-start pt-20 px-4 overflow-hidden pb-20">
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl w-full flex flex-col items-center text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-[#5c1427]/10 text-[#5c1427] px-6 py-2 rounded-full text-sm font-medium mb-8 shadow-sm hover:scale-105 transition-transform cursor-default border border-[#5c1427]/20">

                    <span>System Status: Ready for Ingestion</span>
                </div>

                {/* Heading */}
                <h1 className="text-5xl md:text-7xl font-bold text-[#1E1E1E] mb-4 tracking-tight">
                    Data Ingestion <span className="text-[#5c1427]">Portal</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 mb-12 font-light">
                    Securely upload your source data and target constraints to initiate the optimization workflow.
                </p>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full max-w-5xl">
                    <FeatureCard
                        icon={<ScanLine className="w-5 h-5 text-[#5c1427]" />}
                        text="Multi-format Processing"
                    />
                    <FeatureCard
                        icon={<Workflow className="w-5 h-5 text-[#5c1427]" />}
                        text="Automated Workflow Integration"
                    />
                    <FeatureCard
                        icon={<FileText className="w-5 h-5 text-[#5c1427]" />}
                        text="Advanced Data Extraction"
                    />
                </div>

                {/* Upload Area */}
                <div className="w-full relative">
                    {!isIngesting ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            {/* No need to pass onStartIngestion anymore as store handles it */}
                            <UploadArea />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
                            <ProcessingConsole />
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
};

const FeatureCard = ({ icon, text }: { icon: React.ReactNode, text: string }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 p-4 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-medium hover:shadow-md transition-shadow">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-900">
                {icon}
            </div>
            <span>{text}</span>
        </div>
    );
};

export default HeroSection;