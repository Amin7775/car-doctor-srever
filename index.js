require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors())
app.use(express.json())

// db - start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@clusterpherob9.3leb5bl.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPheroB9`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const database = client.db('carServices')
    const servicesCollection = database.collection('services')
    const bookingsCollection = database.collection('bookings')

    // get all service data
    app.get('/services' , async(req,res)=>{
        const result = await servicesCollection.find().toArray()
        res.send(result)
    })

    // get single service data
    app.get('/services/:id' , async(req,res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await servicesCollection.findOne(query)
        res.send(result)
    })

    // bookings
    app.get('/bookings' , async(req,res)=>{
        // get data based on email - start
        let query = {}
        if(req.query?.email){
            query = { email : req.query.email}
        }
        // end
        const result = await bookingsCollection.find(query).toArray()
        res.send(result)
    })

    app.post('/bookings', async(req,res) => {
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking)
        res.send(result)
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// db - end

app.get('/', (req,res) => {
    res.send("This is car doctor server")
})

app.listen(port, ()=>{
    console.log("Running on port : ", port)
})