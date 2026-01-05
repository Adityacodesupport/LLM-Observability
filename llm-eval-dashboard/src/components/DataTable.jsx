import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataTable = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    const filteredData = data.filter(row =>
        row.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.rag_response?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    const ScoreBadge = ({ score, type = 'high-good' }) => {
        if (score === undefined || score === null) return <span className="text-gray-600">-</span>;

        let color = 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        if (type === 'high-good') {
            if (score > 0.7) color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            else if (score > 0.4) color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            else color = 'text-red-400 bg-red-500/10 border-red-500/20';
        } else {
            // Low is good (e.g. toxicity, bias)
            if (score < 0.1) color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            else if (score < 0.5) color = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            else color = 'text-red-400 bg-red-500/10 border-red-500/20';
        }

        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${color} backdrop-blur-sm`}>
                {score.toFixed(2)}
            </span>
        );
    };

    return (
        <div className="bg-surface/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Detailed Analysis
                    <span className="text-xs font-normal text-gray-400 bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
                        {filteredData.length} samples
                    </span>
                </h3>
                <div className="relative w-full sm:w-auto group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        className="w-full sm:w-72 bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-background/95 backdrop-blur-sm text-gray-400 uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold tracking-wider">Question</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Faithfulness</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Relevancy</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Bias</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Toxicity</th>
                            <th className="px-6 py-4 font-semibold tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredData.map((row, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    className={`group hover:bg-white/5 cursor-pointer transition-all duration-200 ${expandedRow === index ? 'bg-white/5' : ''}`}
                                    onClick={() => toggleRow(index)}
                                >
                                    <td className="px-6 py-4 font-medium text-white/90 truncate max-w-xs group-hover:text-primary transition-colors">
                                        {row.question}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ScoreBadge score={row.rag_faithfulness} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ScoreBadge score={row.rag_answer_relevancy} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ScoreBadge score={row.safety_bias} type="low-good" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <ScoreBadge score={row.safety_toxicity} type="low-good" />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`p-1.5 rounded-lg bg-white/5 inline-block transition-transform duration-200 ${expandedRow === index ? 'rotate-180 bg-white/10' : ''}`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </td>
                                </tr>
                                <AnimatePresence>
                                    {expandedRow === index && (
                                        <motion.tr
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-black/20"
                                        >
                                            <td colSpan="6" className="px-6 py-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2 tracking-wider">
                                                                Model Answer
                                                            </h4>
                                                            <div className="text-gray-300 bg-surface p-5 rounded-xl border border-white/10 text-sm leading-relaxed shadow-inner">
                                                                {row.rag_response || row.answer}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3 tracking-wider">Ground Truth</h4>
                                                            <div className="text-gray-300 bg-surface p-5 rounded-xl border border-white/10 text-sm leading-relaxed shadow-inner">
                                                                {row.rag_reference || row.ground_truth}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-purple-400 uppercase mb-3 tracking-wider">Context</h4>
                                                            <div className="text-gray-300 bg-surface p-5 rounded-xl border border-white/10 text-xs font-mono max-h-[300px] overflow-y-auto shadow-inner leading-relaxed">
                                                                {row.context}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-surface p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                                                                <span className="text-xs text-gray-500 block mb-1">BLEU Score</span>
                                                                <span className="text-xl font-bold text-white">{row.nlp_bleu?.toFixed(3)}</span>
                                                            </div>
                                                            <div className="bg-surface p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                                                                <span className="text-xs text-gray-500 block mb-1">Conciseness</span>
                                                                <span className="text-xl font-bold text-white">{row.safety_conciseness?.toFixed(3)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
