require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const dbURI = process.env.DATABASE_URL;
const port = process.env.PORT;

const mongoPassword = encodeURIComponent(process.env.DB_PASSWORD);
const mongoUserName = encodeURIComponent(process.env.DB_USERNAME);

const app = express();

const uri = dbURI.replace('mongoUserName', mongoUserName).replace('mongoPassword', mongoPassword);
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectToDb() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("connected to db");
  } catch(error) {
    console.log('error while connecting to db', error);
  }
}

const validateToken = (req, res, next) => {
  const cookies = req.cookies;
  const token = cookies.token;
  if (token) {
    try {
      jwt.verify(token, 'yourSecretKey', (err, payload) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: 'Invalid token',
          });
        } else {
          req.user = payload;
          next();
        }
      });
    } catch (error) {
    }
    
  } else {
    res.status(401).json({
      success: false,
      message: 'Token is not provided',
    });
  }
};

app.use(cookieParser());
const allowedOrigins = ['http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
      'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
    },
    credentials: true
  }),
  
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/focus', validateToken, require('./routes/focus'));

async function startServer () {
    try {
        await connectToDb();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.log('error white start server', error);
    }
}
startServer();