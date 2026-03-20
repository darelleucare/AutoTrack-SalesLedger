import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface ChecklistEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export default function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No items yet. Add one below.</p>
        )}
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5 text-sm group">
            <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
            <span className="flex-1 truncate">{item}</span>
            <button
              onClick={() => moveItem(i, -1)}
              disabled={i === 0}
              className="p-0.5 hover:bg-accent rounded disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveItem(i, 1)}
              disabled={i === items.length - 1}
              className="p-0.5 hover:bg-accent rounded disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => removeItem(i)}
              className="p-0.5 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Add new item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
