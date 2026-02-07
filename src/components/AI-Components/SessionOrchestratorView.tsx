import React, { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Target, Zap, BarChart3, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import UploadedFilesStep from './UploadedFilesStep';
import GoalDefinitionForm from './GoalDefinitionForm';
import OptimizationResultsView from './OptimizationResultsView';
// import ResultsDashboard from './ResultsDashboard'; // Commented out for now

const STEPS = [
    { id: 'uploads', label: 'Data Assets', icon: FileText },
    { id: 'goals', label: 'Goal Planning', icon: Target },
    { id: 'optimization', label: 'Optimization', icon: Zap },
    // { id: 'results', label: 'Results', icon: BarChart3 } // Commented out for now
];

const SessionOrchestratorView = () => {
    const { sessionStatus, resultData } = useSessionStore();
    const [activeStep, setActiveStep] = useState('uploads');
    const hasGoals = resultData;
    const hasOptimization = (resultData as any)?.optimization;

    // Sync active step with session status
    useEffect(() => {
        if (sessionStatus === 'CONFIGURING') {
            setActiveStep('goals');
        } else if (sessionStatus === 'PROCESSING') {
            // Distinguish between Ingestion (no goals yet) and Optimization (goals exist)
            if (hasGoals) {
                setActiveStep('optimization');
            } else {
                setActiveStep('uploads');
            }
        } else if (sessionStatus === 'COMPLETED') {
            // Show optimization results when completed
            setActiveStep('optimization');
        } else if (sessionStatus === 'FAILED') {
            setActiveStep(hasGoals ? 'optimization' : 'uploads');
        }
    }, [sessionStatus, hasGoals]);

    const isStepAccessible = (stepId: string) => {
        // Always allow seeing uploads if session exists
        if (stepId === 'uploads') return true;

        // Goals accessible if we are configuring or passed it (and ingestion done)
        const ingestionDone = sessionStatus !== 'IDLE' && !(sessionStatus === 'PROCESSING' && !hasGoals);
        if (stepId === 'goals') return ingestionDone;

        // Optimization accessible if we reached that stage or have optimization data
        const passedGoals = ['PROCESSING', 'COMPLETED', 'FAILED'].includes(sessionStatus) && hasGoals;
        if (stepId === 'optimization') return passedGoals || hasOptimization;

        // Results tab commented out
        // if (stepId === 'results') return ['COMPLETED'].includes(sessionStatus);

        return false;
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Stepper Header (Tab Style) */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                        {STEPS.map((step) => {
                            const isActive = activeStep === step.id;
                            const isAccessible = isStepAccessible(step.id);
                            const Icon = step.icon;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => isAccessible && setActiveStep(step.id)}
                                    disabled={!isAccessible}
                                    className={cn(
                                        "group flex items-center gap-2 py-4 relative transition-colors outline-none",
                                        isActive ? "text-gray-900" : isAccessible ? "text-gray-500 hover:text-gray-700" : "text-gray-300 cursor-not-allowed"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                    <span className={cn("text-sm font-medium", isActive ? "font-semibold" : "")}>
                                        {step.label}
                                    </span>

                                    {isActive && (
                                        <motion.span
                                            layoutId="active-tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full max-w-6xl mx-auto min-h-[500px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        {activeStep === 'uploads' && (
                            sessionStatus === 'PROCESSING' && (
                                <UploadedFilesStep />
                            )
                        )}
                        {activeStep === 'goals' && (
                            <div className="w-full">
                                {/* Pass a dummy onNext, the form handles submission itself via Orchestrator */}
                                <GoalDefinitionForm onNext={() => setActiveStep('optimization')} />
                            </div>
                        )}
                        {activeStep === 'optimization' && (
                            <div className="w-full">
                                <OptimizationResultsView />
                            </div>
                        )}
                        {/* Results tab commented out for now */}
                        {/* {activeStep === 'results' && <ResultsDashboard />} */}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SessionOrchestratorView;

