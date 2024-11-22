import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
})

const allItems = Array.from({ length: 300 }, (_, index) => ({
    id: index + 1,
    title: `Title ${index + 1}`,
    isSelected: false,
}));

// This endpoint returns default items
app.get('/items', (req, res) => {

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search= req.query.search || '';

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Filter by search term
    const filteredItems = allItems.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    // Paginate the items array
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    res.json({
        page,
        limit,
        totalItems: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit),
        data: paginatedItems
    });
});

// This endpoint takes array of items to update the allItems array
app.put('/items', (req, res) => {
    const { items } = req.body;

    const updatedItems = items.map((updatedItem) => {
        const existingItem = allItems.find((item) => item.id === updatedItem.id);
        if (existingItem) {
            return {
                ...existingItem,
                ...updatedItem,
            };
        }
        return null;
    }).filter(Boolean);

    // Update `allItems` to reflect the new order
    const updatedIds = new Set(items.map((item) => item.id));
    const remainingItems = allItems.filter((item) => !updatedIds.has(item.id));
    allItems.splice(0, allItems.length, ...updatedItems, ...remainingItems);

    res.status(200).send({ message: 'Items updated successfully' });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})