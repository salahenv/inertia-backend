require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const dbURI = process.env.DATABASE_URL;
const port = process.env.PORT;
const mongoPassword = encodeURIComponent('KaneSuger@2030Mongo');
const mongoUserName = encodeURIComponent('salahenv');
const app = express();

const uri = `mongodb+srv://${mongoUserName}:${mongoPassword}@cluster0.nvvwn.mongodb.net/inertia?retryWrites=true&w=majority&appName=Cluster0`;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectToDb() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("connected to db");
  } catch(error) {
    console.log('error while connecting to db', error);
  }
}

var allowedOrigins = ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
      'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
    }
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/auth', require('./routes/auth'));

async function startServer () {
    try {
        await connectToDb();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.log('error', error);
    }
}
startServer();