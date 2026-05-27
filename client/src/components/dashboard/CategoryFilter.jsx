import { CATEGORIES } from '../../constants/tools';

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Tool categories">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          id={`category-filter-${cat.id}`}
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(cat.id)}
          className={`category-pill ${active === cat.id ? 'active' : ''}`}
        >
          <span className="mr-1.5">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
