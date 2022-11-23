const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express()



app.get('/', (req, res) => {
    res.send('Book resell server is running')
})


app.listen(port, () => {
    console.log(`Book Resell server is running in port ${port}`);
})