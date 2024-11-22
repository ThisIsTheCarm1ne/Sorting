import {
    useState,
    useEffect,
    useRef,
    useCallback
} from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable
} from '@dnd-kit/sortable';
import {
    CSS
} from '@dnd-kit/utilities';

interface Item {
    id: number;
    title: string;
    isSelected: boolean;
}

function SortableItem(props: {
    item: Item,
    toggleSelect: () => void;
}) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id: props.item.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: props.item.isSelected ? '2px solid blue' : 'none',
        width: '10vw',
        height: '8vh',
        backgroundColor: '#f9f9f9'
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onDoubleClick={() => props.toggleSelect()}
        >
            <p>{props.item.title}</p>
        </div>
    );
}

export default function ItemList() {
    //Items related
    const [items, setItems] = useState<Item[]>([]);
    const [search, setSearch] = useState('');
    //Pagination Related
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState<boolean>(false);

    // Infinity scroll
    const observerRef = useRef<HTMLDivElement | null>(null);

    const loadMore = useCallback(async () => {
        if (!hasMore) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/items?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
            const data = await response.json();

            setItems((prev) => [...prev, ...data.data]);
            setHasMore(page < data.totalPages);
            setPage((prev) => prev + 1);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    // Intersection Observer setup
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !loading) {
                    loadMore();
                }
            },
            { threshold: 1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) observer.unobserve(observerRef.current);
        };
    }, [loadMore, loading]);

    const saveUpdatedItems = async (updatedItems: Item[]) => {
        console.log(items);
        try {
            const response = await fetch('http://localhost:3000/items', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: updatedItems }),
            });

            if (!response.ok) {
                throw new Error(`Error updating items: ${response.statusText}`);
            }

            console.log('Items successfully updated on the server');
        } catch (error) {
            console.error('Error saving items:', error);
        }
    };

    const toggleSelect = (id: number) => {
        setItems((prevItems) => {
            const updatedItems = prevItems.map((item) =>
                item.id === id
                    ? {...item, isSelected: !item.isSelected}
                    : item
            );
            saveUpdatedItems(updatedItems);
            return updatedItems;
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFilter = (searchTerm: string) => {
        setSearch(searchTerm);
        setItems([]);
        setPage(1);
        setHasMore(true);
    };

    function handleDragEnd(event) {
        const {active, over} = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newArray = arrayMove(items, oldIndex, newIndex);
                saveUpdatedItems(newArray);
                return newArray;
            });

        }
    }

    return (
        <div>
            <input
                type="text"
                placeholder="Search by title..."
                onChange={(e) => handleFilter(e.target.value)}
            />
            <div>
                <h1>Items</h1>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '50px'}}>
                            {items.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    toggleSelect={() => toggleSelect(item.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
            {/* Loader div for intersection observer */}
            <div ref={observerRef} className="loader">
                {loading && <p>Loading more polls...</p>}
            </div>
        </div>
    )
}