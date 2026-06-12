"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GoalDefinition, GoalModel, DataContext, GAParams } from '@/types/models';

export type CanvasTab = 'monitor' | 'results' | 'assignments' | 'goals' | 'config' | 'datasets' | 'insights';

interface CanvasState {
    isOpen: boolean;
    isMinimized: boolean;
    tab: CanvasTab;
    sessionId: string | null;
    goals: GoalDefinition[];
    gaParams: GAParams | null;
    preexistingJobId: string | null;
    dataContext: DataContext | null;
    problemName: string | null;
}

interface CanvasContextValue extends CanvasState {
    open: (tab?: CanvasTab, opts?: { sessionId?: string; goals?: GoalDefinition[]; gaParams?: GAParams | null; preexistingJobId?: string | null; dataContext?: DataContext | null; problemName?: string | null }) => void;
    close: () => void;
    minimize: () => void;
    restore: () => void;
    setTab: (tab: CanvasTab) => void;
    /** Push updated state without changing open/tab — used by SmartUploadWizard on every turn */
    sync: (opts: { sessionId?: string; goals?: GoalDefinition[]; dataContext?: DataContext | null; problemName?: string | null; preexistingJobId?: string | null }) => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<CanvasState>({
        isOpen: false,
        isMinimized: false,
        tab: 'monitor',
        sessionId: null,
        goals: [],
        gaParams: null,
        preexistingJobId: null,
        dataContext: null,
        problemName: null,
    });

    const open = useCallback((tab: CanvasTab = 'monitor', opts?: { sessionId?: string; goals?: GoalDefinition[]; gaParams?: GAParams | null; preexistingJobId?: string | null; dataContext?: DataContext | null; problemName?: string | null }) => {
        setState(prev => ({
            ...prev,
            isOpen: true,
            isMinimized: false,
            tab,
            ...(opts?.sessionId !== undefined && { sessionId: opts.sessionId }),
            ...(opts?.goals !== undefined && { goals: opts.goals }),
            ...(opts?.gaParams !== undefined && { gaParams: opts.gaParams }),
            ...(opts?.preexistingJobId !== undefined && { preexistingJobId: opts.preexistingJobId }),
            ...(opts?.dataContext !== undefined && { dataContext: opts.dataContext }),
            ...(opts?.problemName !== undefined && { problemName: opts.problemName }),
        }));
    }, []);

    const close = useCallback(() => setState(prev => ({ ...prev, isOpen: false, isMinimized: false })), []);
    const minimize = useCallback(() => setState(prev => ({ ...prev, isMinimized: true })), []);
    const restore = useCallback(() => setState(prev => ({ ...prev, isMinimized: false })), []);
    const setTab = useCallback((tab: CanvasTab) => setState(prev => ({ ...prev, tab })), []);

    const sync = useCallback((opts: { sessionId?: string; goals?: GoalDefinition[]; dataContext?: DataContext | null; problemName?: string | null; preexistingJobId?: string | null }) => {
        setState(prev => ({
            ...prev,
            ...(opts.sessionId !== undefined && { sessionId: opts.sessionId }),
            ...(opts.goals !== undefined && { goals: opts.goals }),
            ...(opts.dataContext !== undefined && { dataContext: opts.dataContext }),
            ...(opts.problemName !== undefined && { problemName: opts.problemName }),
            ...(opts.preexistingJobId !== undefined && { preexistingJobId: opts.preexistingJobId }),
        }));
    }, []);

    return (
        <CanvasContext.Provider value={{ ...state, open, close, minimize, restore, setTab, sync }}>
            {children}
        </CanvasContext.Provider>
    );
};

const NOOP_CANVAS: CanvasContextValue = {
    isOpen: false, isMinimized: false, tab: 'monitor', sessionId: null,
    goals: [], gaParams: null, preexistingJobId: null, dataContext: null, problemName: null,
    open: () => {}, close: () => {}, minimize: () => {}, restore: () => {}, setTab: () => {}, sync: () => {},
};

export const useCanvas = (): CanvasContextValue => {
    const ctx = useContext(CanvasContext);
    return ctx ?? NOOP_CANVAS;
};
