import { NavLink } from 'react-router-dom';
import { CATEGORIES, getToolsByCategory } from '../../constants/tools';

export default function ToolSidebar({ currentToolId }) {
  // Filter out 'all' category
  const categories = CATEGORIES.filter(c => c.id !== 'all');

  return (
    <div className="w-64 flex-shrink-0 hidden lg:block mr-6">
      <div className="glass rounded-2xl p-4 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">
        <h3 className="text-white/80 font-display font-semibold text-sm uppercase tracking-wider mb-4 px-2">
          Tools
        </h3>
        
        <div className="space-y-6">
          {categories.map(category => {
            const tools = getToolsByCategory(category.id);
            if (tools.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-white/40 px-2 uppercase tracking-wide">
                  <span>{category.icon}</span>
                  {category.label}
                </div>
                <div className="space-y-1">
                  {tools.map(tool => {
                    const isActive = tool.id === currentToolId;
                    return (
                      <NavLink
                        key={tool.id}
                        to={`/workspace/${tool.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                        }`}
                      >
                        <span className="text-lg opacity-80">{tool.icon}</span>
                        <span className="truncate">{tool.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
