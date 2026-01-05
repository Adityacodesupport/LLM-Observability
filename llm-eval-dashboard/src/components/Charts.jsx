import React from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const ChartContainer = ({ title, children }) => (
    <div className="h-[350px] w-full bg-surface/50 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-lg hover:border-white/20 transition-colors duration-300">
        <h3 className="text-lg font-semibold mb-6 text-white/90 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            {title}
        </h3>
        <div className="h-[250px] w-full">
            {children}
        </div>
    </div>
);

export const RAGRadarChart = ({ data }) => {
    const chartData = [
        { subject: 'Faithfulness', A: data.rag_faithfulness, fullMark: 1 },
        { subject: 'Relevancy', A: data.rag_answer_relevancy, fullMark: 1 },
        { subject: 'Precision', A: data.rag_context_precision, fullMark: 1 },
        { subject: 'Recall', A: data.rag_context_recall, fullMark: 1 },
    ];

    return (
        <ChartContainer title="RAG Metrics Overview">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#475569" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        itemStyle={{ color: '#60a5fa' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export const SafetyMetricsChart = ({ data }) => {
    const chartData = [
        { name: 'Bias', score: data.safety_bias, fill: '#ef4444' },
        { name: 'Toxicity', score: data.safety_toxicity, fill: '#f97316' },
        { name: 'Conciseness', score: data.safety_conciseness, fill: '#3b82f6' },
    ];

    return (
        <ChartContainer title="Safety & Quality">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} strokeOpacity={0.3} />
                    <XAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        cursor={{ fill: '#334155', opacity: 0.2 }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export const NLPMetricsChart = ({ data }) => {
    const chartData = [
        { name: 'BLEU', score: data.nlp_bleu },
        { name: 'ROUGE-L', score: data.nlp_rougeL },
    ];

    return (
        <ChartContainer title="NLP Metrics">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        cursor={{ fill: '#334155', opacity: 0.2 }}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};
