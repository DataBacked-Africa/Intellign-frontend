import React from 'react';
import { useSessionStore, OptimizationResult, ComplexOptimizationResult, SimpleOptimizationResult } from '@/store/useSessionStore';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Clock, Activity, RefreshCw, MessageSquare } from 'lucide-react';

const ResultsDashboard = () => {
    const { resultData, clearSession } = useSessionStore();

    if (!resultData) return null;

    // Type Guard for Complex Result
    const isComplex = (data: OptimizationResult): data is ComplexOptimizationResult => {
        return 'convergence_score' in data;
    };

    if (!isComplex(resultData)) {
        // Render Simple Dashboard
        const { score, feedback, timestamp, optimized_allocation } = resultData as SimpleOptimizationResult;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="p-2 rounded-full bg-blue-100 text-blue-700">
                                <CheckCircle2 className="w-8 h-8" />
                            </span>
                            Optimization Result
                        </h2>
                        <p className="text-gray-500 mt-1 ml-14">
                            Completed on {new Date(timestamp).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={clearSession}
                        className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        New Session
                    </button>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Activity className="w-32 h-32 text-[#5c1427]" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="text-center md:text-left">
                            <p className="text-sm font-medium text-gray-500 mb-2">Overall Score</p>
                            <h3 className="text-6xl font-bold text-[#5c1427]">{score}%</h3>
                        </div>
                        <div className="flex-1 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Analysis Feedback
                            </h4>
                            <p className="text-gray-700 italic">"{feedback}"</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Optimized Allocation</h3>
                    <div className="space-y-4">
                        {optimized_allocation?.map((alloc, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700">{alloc.category}</span>
                                    <span className="text-gray-500">{alloc.percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#5c1427] rounded-full"
                                        style={{ width: `${alloc.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Complex Dashboard
    const {
        status,
        convergence_score,
        iterations_run = 0,
        processing_time_ms = 0,
        resources_allocated = [],
        timeline_data = [],
        anomalies_detected = []
    } = resultData as ComplexOptimizationResult;

    const scorePercentage = Math.round(convergence_score * 100);
    const isOptimal = status === 'OPTIMAL';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-8"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className={cn(
                            "p-2 rounded-full",
                            isOptimal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                            {isOptimal ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                        </span>
                        Optimization {isOptimal ? "Complete" : "Failed"}
                    </h2>
                    <p className="text-gray-500 mt-1 ml-14">
                        Analysis finished in {(processing_time_ms / 1000).toFixed(2)}s across {iterations_run} iterations.
                    </p>
                </div>
                <button
                    onClick={clearSession}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    New Session
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Score Card */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-[#5c1427]" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Convergence Score</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={cn(
                            "text-4xl font-bold",
                            scorePercentage >= 90 ? "text-green-600" : "text-[#5c1427]"
                        )}>
                            {scorePercentage}%
                        </h3>
                        <span className="text-sm text-gray-400">confidence</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000", scorePercentage >= 90 ? "bg-green-500" : "bg-[#5c1427]")}
                            style={{ width: `${scorePercentage}%` }}
                        />
                    </div>
                </motion.div>

                {/* Iterations Card */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-medium text-gray-500">Genetic Generations</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{iterations_run}</h3>
                    <p className="text-xs text-gray-400 mt-1">Total evolution cycles</p>
                </motion.div>

                {/* Time Card */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-medium text-gray-500">Processing Time</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{processing_time_ms}ms</h3>
                    <p className="text-xs text-gray-400 mt-1">Server execution time</p>
                </motion.div>

                {/* Anomalies Card */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                        "p-6 rounded-2xl shadow-sm border",
                        anomalies_detected.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
                    )}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={cn("w-4 h-4", anomalies_detected.length > 0 ? "text-amber-600" : "text-gray-400")} />
                        <p className={cn("text-sm font-medium", anomalies_detected.length > 0 ? "text-amber-700" : "text-gray-500")}>
                            Anomalies Detected
                        </p>
                    </div>
                    <h3 className={cn("text-2xl font-bold", anomalies_detected.length > 0 ? "text-amber-900" : "text-gray-900")}>
                        {anomalies_detected.length}
                    </h3>
                    <p className={cn("text-xs mt-1", anomalies_detected.length > 0 ? "text-amber-600" : "text-gray-400")}>
                        {anomalies_detected.length > 0 ? "Review warnings below" : "Data clean"}
                    </p>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Convergence Chart (Line) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Algorithm Convergence</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeline_data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="gen"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    label={{ value: 'Generation', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#6B7280' }}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 1]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#5c1427"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#5c1427" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Resource Allocation (Bar) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Resource Allocation</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={resources_allocated.slice(0, 8)} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="target"
                                    type="category"
                                    stroke="#4B5563"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={60}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                                    {resources_allocated.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.efficiency > 0.9 ? "#22c55e" : "#5c1427"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Anomalies List */}
            {anomalies_detected.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-6"
                >
                    <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Data Quality Alerts
                    </h3>
                    <ul className="space-y-2">
                        {anomalies_detected.map((alert, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-amber-800 bg-white/50 p-2 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {alert}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}
        </motion.div>
    );
};

export default ResultsDashboard;
