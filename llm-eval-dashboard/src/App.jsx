import React, { useEffect, useState } from 'react';
import { Activity, Shield, Zap, Database, AlertCircle, RefreshCw, CheckCircle, BarChart3 } from 'lucide-react';
import MetricCard from './components/MetricCard';
import { RAGRadarChart, NLPMetricsChart, SafetyMetricsChart } from './components/Charts';
import DataTable from './components/DataTable';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/results')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-400 font-medium tracking-wide animate-pulse">Loading evaluation results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-500 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="text-center p-8 bg-surface/50 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl max-w-md w-full mx-4 relative z-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Connection Error</h2>
          <p className="mb-6 text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/20 font-medium w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, data: rows } = data;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                LLM Observability
              </h1>
            </div>
            <p className="text-gray-400 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              System Status: Operational
              <span className="mx-2 text-gray-700">|</span>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-sm font-medium backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
            <span className="text-gray-300 group-hover:text-white transition-colors">Refresh Data</span>
          </button>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Faithfulness"
            value={summary.rag_faithfulness}
            icon={Shield}
            color="blue"
            delay={0.1}
          />
          <MetricCard
            title="Answer Relevancy"
            value={summary.rag_answer_relevancy}
            icon={Zap}
            color="green"
            delay={0.2}
          />
          <MetricCard
            title="Safety Score (Bias)"
            value={summary.safety_bias}
            icon={AlertCircle}
            color="orange"
            delay={0.3}
          />
          <MetricCard
            title="NLP Quality (BLEU)"
            value={summary.nlp_bleu}
            icon={Activity}
            color="purple"
            delay={0.4}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RAGRadarChart data={summary} />
          </div>
          <div className="lg:col-span-1">
            <SafetyMetricsChart data={summary} />
          </div>
          <div className="lg:col-span-1">
            <NLPMetricsChart data={summary} />
          </div>
        </div>

        {/* Data Table */}
        <DataTable data={rows} />
      </div>
    </div>
  );
}

export default App;
