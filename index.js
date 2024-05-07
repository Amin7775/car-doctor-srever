require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


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

const verifyToken = async(req,res,next)=>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({message : 'Not Authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , async(err,decoded) =>{
        if(err){
            return res.status(401).send({message : 'Not Authorized'})
        }
        req.user = decoded;
        next()
    })
}

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

    // authorization related / jwt related data
    app.post('/jwt' , async(req,res)=>{
        const user = req.body;
        console.log(user)
        // access token generate -start 60.3 12.40
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
        // access token generate -start
        res
        .cookie('token', token , {
            httpOnly: true,
            secure: false,
            // sameSite : 'none'
        })
        .send({success : true})
    })

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
    app.get('/bookings', verifyToken , async(req,res)=>{
        // getting token cookie from client
        const token = req.cookies.token
        console.log(token)
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

    app.delete('/bookings/:id', async(req,res)=>{
        const id = req.params.id;
        const query = { _id : new ObjectId(id)}
        const result = await bookingsCollection.deleteOne(query)
        res.send(result)
    })

    app.patch('/bookings/:id', async(req,res)=>{
        const updatedBooking = req.body;
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)}
        const updateDoc = {
            $set:{
                status : updatedBooking.status
            },
        }
        const result = await bookingsCollection.updateOne(filter,updateDoc)
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