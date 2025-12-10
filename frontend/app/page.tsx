import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            🏛️ The Temporal Code Archaeologist
          </h1>
          <p className="text-2xl text-slate-300 mb-4">
            Uncover the "Why" Behind Every Line of Code
          </p>
          <p className="text-lg text-slate-400 mb-12">
            AI-powered analysis that reconstructs the historical context, business reasoning, and technical decisions behind your codebase.
          </p>

          <div className="flex gap-4 justify-center">
            <Link 
              href="/excavate"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Start Excavation →
            </Link>
            <Link 
              href="/about"
              className="px-8 py-4 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <FeatureCard 
            emoji="🔍"
            title="Deep Analysis"
            description="Analyze git history, commits, and code changes to understand business context."
          />
          <FeatureCard 
            emoji="🧠"
            title="AI-Powered Insights"
            description="Google Gemini 1.5 Pro extracts technical rationale and decision patterns."
          />
          <FeatureCard 
            emoji="🕸️"
            title="Knowledge Graphs"
            description="Visual representation of code relationships, dependencies, and authors."
          />
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Powered by the Infinity Stones Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <TechBadge name="Gemini" color="from-yellow-400 to-orange-400" />
            <TechBadge name="Vercel" color="from-black to-slate-800" />
            <TechBadge name="Kestra" color="from-purple-400 to-pink-400" />
            <TechBadge name="Oumi" color="from-blue-400 to-cyan-400" />
            <TechBadge name="CodeRabbit" color="from-green-400 to-emerald-400" />
            <TechBadge name="TypeScript" color="from-blue-500 to-blue-600" />
          </div>
        </div>

        {/* API Status */}
        <div className="mt-20 text-center">
          <div className="inline-block px-6 py-3 bg-slate-800 rounded-lg">
            <span className="text-slate-400">API Status: </span>
            <span className="text-green-400">● Live</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-slate-800/50 rounded-xl backdrop-blur border border-slate-700 hover:border-purple-500/50 transition-all">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

function TechBadge({ name, color }: { name: string; color: string }) {
  return (
    <div className={`px-4 py-2 bg-gradient-to-r ${color} rounded-lg text-white font-semibold text-sm`}>
      {name}
    </div>
  );
}
