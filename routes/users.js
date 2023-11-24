const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const { processenv } = require('processenv');

const dbPassword = processenv('dbpw');
const url = `mongodb+srv://mongo:${dbPassword}@cluster0.zmyzsv5.mongodb.net/?retryWrites=true&w=majority`; 

router.post('/', (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
    if(err) throw err;
    let db = client.db("advizDB");
    db.collection('users').findOne({username: username, password: password}, (err, result) => {
      if(err) throw err;
      if(result == null) {
        res.sendStatus(401);
      }
      else {
        res.status(200).json(result);
      }
      client.close();
    });
  });
});

module.exports = router;
