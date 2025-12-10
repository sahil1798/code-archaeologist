export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">🏛️ Code Archaeologist</h1>
        <p className="text-gray-400 mb-8">Uncovering the 'why' behind your code</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">📊 Dashboard</h2>
            <p className="text-gray-400">View excavation reports and insights</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">🕸️ Knowledge Graph</h2>
            <p className="text-gray-400">Visualize code relationships</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">📁 File Explorer</h2>
            <p className="text-gray-400">Browse analyzed files</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">⏰ Timeline</h2>
            <p className="text-gray-400">Code evolution over time</p>
          </div>
        </div>
        
        <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-amber-500 mb-2">🎯 Infinity Stones Integration</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>✅ Gemini AI</div>
            <div>✅ Oumi Training</div>
            <div>✅ Kestra Workflows</div>
            <div>✅ Vercel Deployment</div>
            <div>✅ CodeRabbit Review</div>
            <div>✅ Cline Agent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
