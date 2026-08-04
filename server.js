const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve the current directory as static files
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
