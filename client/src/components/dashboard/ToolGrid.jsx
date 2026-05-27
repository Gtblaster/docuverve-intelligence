import ToolCard from './ToolCard';

export default function ToolGrid({ tools }) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-white/40 text-xl font-semibold">No tools found</p>
        <p className="text-white/25 text-sm mt-2">Try a different search term or category filter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
