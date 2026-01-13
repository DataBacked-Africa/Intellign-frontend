"use client";

import React from 'react';
import UploadArea from './UploadArea';
import ProcessingConsole from './ProcessingConsole';
import ResultsDashboard from './ResultsDashboard';
import GoalDefinitionForm from './GoalDefinitionForm';
import { useSessionStore } from '@/store/useSessionStore';
import { motion } from 'framer-motion';


const MainWorkspace = () => {
    const { sessionStatus, setStatus } = useSessionStore();
    const isIngesting = sessionStatus !== 'IDLE' && sessionStatus !== 'CONFIGURING';
    const isConfiguring = sessionStatus === 'CONFIGURING';

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 relative">

            {/* Background Branding (Subtle) */}
            

            <div className="w-full max-w-5xl z-10">
                {sessionStatus === 'COMPLETED' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ResultsDashboard />
                    </motion.div>
                ) : isConfiguring ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <GoalDefinitionForm onNext={() => { }} />
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
