import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChecklistEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  bankRequiredItems?: string[];
  onBankRequiredChange?: (items: string[]) => void;
  showBankRequired?: boolean;
}

function SortableItem({ id, index, item, onRemove, isBankRequired, onToggleBankRequired, showBankRequired }: {
  id: string; index: number; item: string; onRemove: () => void;
  isBankRequired?: boolean; onToggleBankRequired?: () => void; showBankRequired?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5 text-sm group"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs text-muted-foreground w-5 shrink-0">{index + 1}.</span>
      <span className="flex-1 truncate">{item}</span>
      {showBankRequired && (
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 cursor-pointer" title="Required by Bank">
          <input
            type="checkbox"
            checked={isBankRequired || false}
            onChange={onToggleBankRequired}
            className="w-3 h-3 accent-primary rounded"
          />
          <span className={isBankRequired ? 'text-primary font-medium' : ''}>Bank</span>
        </label>
      )}
      <button
        onClick={onRemove}
        className="p-0.5 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ChecklistEditor({ items, onChange, bankRequiredItems, onBankRequiredChange, showBankRequired }: ChecklistEditorProps) {
  const [newItem, setNewItem] = useState('');
  const [newItemBankRequired, setNewItemBankRequired] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((item, i) => `${item}-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const toggleBankRequired = (item: string) => {
    if (!onBankRequiredChange || !bankRequiredItems) return;
    if (bankRequiredItems.includes(item)) {
      onBankRequiredChange(bankRequiredItems.filter(i => i !== item));
    } else {
      onBankRequiredChange([...bankRequiredItems, item]);
    }
  };

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      if (showBankRequired && newItemBankRequired && onBankRequiredChange && bankRequiredItems) {
        onBankRequiredChange([...bankRequiredItems, trimmed]);
      }
      setNewItem('');
      setNewItemBankRequired(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">No items yet. Add one below.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((item, i) => (
              <SortableItem
                key={ids[i]}
                id={ids[i]}
                index={i}
                item={item}
                onRemove={() => {
                  onChange(items.filter((_, idx) => idx !== i));
                  if (showBankRequired && onBankRequiredChange && bankRequiredItems) {
                    onBankRequiredChange(bankRequiredItems.filter(r => r !== item));
                  }
                }}
                showBankRequired={showBankRequired}
                isBankRequired={bankRequiredItems?.includes(item)}
                onToggleBankRequired={() => toggleBankRequired(item)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Add new item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        {showBankRequired && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0 px-1" title="Mark as required by bank">
            <input
              type="checkbox"
              checked={newItemBankRequired}
              onChange={e => setNewItemBankRequired(e.target.checked)}
              className="w-3.5 h-3.5 accent-primary rounded"
            />
            <span>Required by Bank</span>
          </label>
        )}
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
