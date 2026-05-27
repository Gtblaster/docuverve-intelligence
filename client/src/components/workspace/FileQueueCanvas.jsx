import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FileCard from './FileCard';

/**
 * Sortable wrapper for an individual FileCard.
 * Injects dnd-kit drag-handle props and transform styles.
 */
function SortableFileCard({ item, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FileCard
        item={item}
        index={index}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/**
 * Drag-and-drop sortable file queue list.
 * @param {object[]} queue - Array of queue items
 * @param {(id: string) => void} onRemove - Remove a file by id
 * @param {(fromIndex: number, toIndex: number) => void} onReorder - Reorder callback
 */
export default function FileQueueCanvas({ queue, onRemove, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = queue.findIndex(f => f.id === active.id);
    const toIndex = queue.findIndex(f => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      onReorder(fromIndex, toIndex);
    }
  }

  if (queue.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={queue.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {queue.map((item, index) => (
            <SortableFileCard
              key={item.id}
              item={item}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
