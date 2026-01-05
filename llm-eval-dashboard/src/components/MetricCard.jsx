import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, color = "blue", delay = 0 }) => {
    const gradients = {
        blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40",
        green: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40",
        purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40",
        orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40",
        pink: "from-pink-500/20 to-pink-600/5 border-pink-500/20 hover:border-pink-500/40",
    };

    const iconColors = {
        blue: "text-blue-400",
        green: "text-emerald-400",
        purple: "text-purple-400",
        orange: "text-orange-400",
        pink: "text-pink-400",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`relative overflow-hidden p-6 rounded-2xl border bg-gradient-to-br ${gradients[color]} backdrop-blur-md transition-all duration-300 group`}
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>

            <div className="relative z-10 flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
                <div className={`p-2 rounded-lg bg-white/5 ${iconColors[color]} group-hover:scale-110 transition-transform duration-300`}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-bold text-white tracking-tight">
                    {typeof value === 'number' ? value.toFixed(3) : value}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                    Score range: 0.0 - 1.0
                </div>
            </div>
        </motion.div>
    );
};

export default MetricCard;
