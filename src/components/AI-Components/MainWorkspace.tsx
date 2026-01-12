"use client";

import React from 'react';
import UploadArea from './UploadArea';
import ProcessingConsole from './ProcessingConsole';
import ResultsDashboard from './ResultsDashboard';
import { useSessionStore } from '@/store/useSessionStore';
import { motion } from 'framer-motion';

const MainWorkspace = () => {
    const { sessionStatus } = useSessionStore();
    const isIngesting = sessionStatus !== 'IDLE';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 relative">

            {/* Background Branding (Subtle) */}
            {!isIngesting && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center opacity-30 select-none pointer-events-none">
                    <h1 className="text-3xl font-bold text-gray-300">DBA Intelligence</h1>
                </div>
            )}

            <div className="w-full max-w-5xl z-10">
                {sessionStatus === 'COMPLETED' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ResultsDashboard />
                    </motion.div>
                ) : !isIngesting ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-3xl mx-auto"
                    >
                        <UploadArea />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <ProcessingConsole />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MainWorkspace;
