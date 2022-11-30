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
        return res.status(401).send({ message: 'unauthorized access' });

    }
    const token = authHeader.split(' ')[1]
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
        const advertiseCollections = client.db('bookResell').collection('advertised')

        // Verfy Admin 
        async function verifyAdmin(req, res, next) {

            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollections.findOne(query)
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            // console.log(decodedEmail);
            next()
        }

        // getTokken 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
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
            const id = req.params.id
            const query = { categoryId: id }
            const matching = await productCollections.find(query).toArray()
            res.send(matching)
        });

        //All products API 
        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productCollections.find(query).toArray()
            res.send(result)
        })
        // seller's Products API
        app.get('/product', async (req, res) => {
            const email = req.query.email;

            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email }
            const myproduct = await productCollections.find(query).toArray();
            res.send(myproduct);
        });

        // Add product API 
        app.post('/products', async (req, res) => {
            const product = req.body
            // console.log(product);
            const result = await productCollections.insertOne(product)
            res.send(result)
        })

        // add order API 
        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await orderCollections.insertOne(order)
            res.send(result)
        });
        // users Order API
        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const myorders = await orderCollections.find(query).toArray();
            res.send(myorders);
        });



        //  user API 
        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {}
            const result = await userCollections.find(query).toArray()
            res.send(result)
        });
        // user API 
        app.get('/users/:id([0-9a-fA-F]{24})', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            // console.log(query);
            const result = await userCollections.findOne(query)
            res.send(result)
        });

        // Add user api 
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await userCollections.insertOne(user)
            res.send(result)
        });

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            const query = { email: email }
            const user = await userCollections.findOne(query);
            res.send(user);
        });
        // Delete user API 
        app.delete('/users/:id([0-9a-fA-F]{24})', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await userCollections.deleteOne(query)
            res.send(result)
        });
        // sellerList API 
        app.get('/users/sellers', verifyJWT, verifyAdmin, async (req, res) => {
            const role = req.query.role
            const query = { role: role }
            const seller = await userCollections.find(query).toArray()
            res.send(seller)

        })
        // Is Seller API 
        app.get("/users/seller/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)

            res.send({ isSeller: user?.role === 'seller' })
        });

        app.get("/users/sellerVerify/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)

            res.send({ isVerified: user?.verified === true })
        });
        // Buyer api 
        app.get('/users/buyers', verifyJWT, verifyAdmin, async (req, res) => {
            const role = req.query.role
            const query = { role: role }
            const seller = await userCollections.find(query).toArray()
            res.send(seller)

        })

        // Admin API 
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)

            res.send({ isAdmin: user?.role === 'Admin' })
        });
        // Make Admin API 
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'Admin'
                }
            }
            const result = await userCollections.updateOne(filter, updateDoc, options);
            res.send(result);


        });
        // verify Seller 
        app.put('/users/verify/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await userCollections.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // advertise api 
        app.post('/seller/advertise', verifyJWT, async (req, res) => {
            const advProduct = req.body
            // console.log(product);
            const result = await advertiseCollections.insertOne(advProduct)
            res.send(result)
        })
        // get advertised Product 
        app.get('/seller/advertise', async (req, res) => {
            const query = {}
            const result = await advertiseCollections.find(query).toArray()
            res.send(result)
        })
        app.delete('/seller/advertise/:id([0-9a-fA-F]{24})', verifyJWT, async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await advertiseCollections.deleteOne(query)
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