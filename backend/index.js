import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
})

let allItems = Array.from({ length: 1_000_000 }, (_, index) => ({
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

// This endpoint searchs for object by id
// Then selects it
app.put('/toggle-select', (req, res) => {
    const { id } = req.body;

    // Find the item by its id
    const item = allItems.find(item => item.id === id);

    if (!item) {
        return res.status(404).send({ message: 'Item not found' });
    }

    item.isSelected = !item.isSelected;

    // Return the updated item or the entire list if necessary
    res.status(200).send({ message: 'Item selection toggled', item });
});

app.put('/reorder-items', (req, res) => {
    const { id, nearestRightItemId } = req.body.items;

    // Find the item to be moved
    const itemIndex = allItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        return res.status(404).send({ message: 'Item not found' });
    }

    // Find the position of the nearestRightItem
    let toIndex = -1;
    if (nearestRightItemId) {
        toIndex = allItems.findIndex(item => item.id === nearestRightItemId);
    }

    // If nearestRightItem doesn't exist, move it to the end
    if (toIndex === -1) {
        toIndex = allItems.length;
    }

    const [item] = allItems.splice(itemIndex, 1);

    allItems.splice(toIndex, 0, item);

    res.status(200).send({ message: 'Items updated successfully' });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})