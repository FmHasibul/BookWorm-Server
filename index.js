const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config();



app.use(cors())
app.use(express.json());

//  JWTverfication 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');

    }
    const token = authHeader.splite(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}



const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const categoryCollections = client.db('bookResell').collection('categorylist')
        const productCollections = client.db('bookResell').collection('products')
        const userCollections = client.db('bookResell').collection('users')
        const orderCollections = client.db('bookResell').collection('orders')


        // getTokken 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' });
                return res.send({ accessToken: token })
            }

            res.status(403).send({ accessToken: '' })
        })


        // category API 
        app.get('/category', async (req, res) => {
            const query = {};
            const options = await categoryCollections.find(query).toArray();
            res.send(options)
        });
        // categoryId wise products API 
        app.get('/category/:id', async (req, res) => {
            const id = parseInt(req.params.id)
            const query = { categoryId: id }
            console.log(query);
            const matching = await productCollections.find(query).toArray()
            res.send(matching)
        });

        // products API 
        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productCollections.find(query).toArray()
            res.send(result)
        })

        //  user API 
        app.get('/users', async (req, res) => {
            const query = {}
            const result = await userCollections.find(query).toArray()
            res.send(result)
        });

        app.get('/users/:id([0-9a-fA-F]{24})', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            // console.log(query);
            const result = await userCollections.findOne(query)
            res.send(result)


        });

        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await userCollections.insertOne(user)
            res.send(result)
        });
        // add order API 
        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await userCollections.insertOne(order)
            res.send(result)
        });


    }

    finally {
    }
}

run().catch(err => console.log(err))









app.get('/', (req, res) => {
    res.send('Book resell server is running')
})


app.listen(port, () => {

    client.connect(err => {
        if (err) {
            console.log(err);
        }
        else {
            console.log('connect to Mongodb');
        }
    });

    console.log(`Book Resell server is running in port ${port}`);
})