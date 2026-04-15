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
    const { sessionStatus, resultData, goals } = useSessionStore();
    const [activeStep, setActiveStep] = useState('uploads');

    // Ingestion is done when resultData has a successful ingestion block
    const hasIngestion = !!(resultData?.ingestion?.status === 'success' || resultData?.ingestion?.resources_metadata);
    // Optimization has been triggered when there's a run_id or global_score
    const hasOptimizationRun = !!(
        (resultData as any)?.run_id ||
        (resultData as any)?.global_score !== undefined ||
        (resultData as any)?.optimization
    );
    const hasDefinedGoals = Object.keys(goals || {}).length > 0;

    // Sync active step with session status
    useEffect(() => {
        if (sessionStatus === 'CONFIGURING') {
            setActiveStep('goals');
        } else if (sessionStatus === 'PROCESSING') {
            if (hasOptimizationRun) {
                setActiveStep('optimization');
            } else if (hasIngestion) {
                // Ingestion done but no optimization started yet — go to goal planning
                setActiveStep('goals');
            } else {
                setActiveStep('uploads');
            }
        } else if (sessionStatus === 'COMPLETED') {
            setActiveStep('optimization');
        } else if (sessionStatus === 'FAILED') {
            setActiveStep(hasOptimizationRun ? 'optimization' : 'uploads');
        }
    }, [sessionStatus, hasIngestion, hasOptimizationRun]);

    const isStepAccessible = (stepId: string) => {
        if (stepId === 'uploads') return true;
        if (stepId === 'goals') return hasIngestion || sessionStatus === 'CONFIGURING';
        if (stepId === 'optimization') return hasDefinedGoals || hasOptimizationRun || ['COMPLETED', 'FAILED'].includes(sessionStatus);
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
                            <UploadedFilesStep />
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

