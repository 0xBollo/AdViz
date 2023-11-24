const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const { processenv } = require('processenv');

const dbPassword = processenv('dbpw');
const url = `mongodb+srv://mongo:${dbPassword}@cluster0.zmyzsv5.mongodb.net/?retryWrites=true&w=majority`; 

router.post('/', (req, res) => {
    let reqContact = req.body;
    let contact = {
        owner: reqContact.owner,
        firstName: reqContact.firstName,
        lastName: reqContact.lastName,
        nickname: reqContact.nickname,
        streetAndNumber: reqContact.streetAndNumber,
        zip: reqContact.zip,
        city: reqContact.city,
        country: reqContact.country,
        phone: reqContact.phone,
        email: reqContact.email,
        dob: reqContact.dob,
        isPublic: reqContact.isPublic,
        coordinates: reqContact.coordinates
    };

    MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
        if(err) throw err;
        let db = client.db("advizDB");
        db.collection('contacts').insertOne(contact, (error, result) => {
            if(error) throw error;
            let id = contact._id;
            res.setHeader('Location', '/contacts/' + id);
            res.sendStatus(201);
            client.close();
        });
    });
});

router.get('/', (req, res) => { 
    MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
        if(err) throw err;
        let db = client.db("advizDB");
        db.collection('contacts').find({}).toArray((err, result) => {
            if(err) throw err;
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json(result);
            client.close();
        });
    });
});

router
    .route('/:id')
    .put((req, res) => {
        let id = req.params.id;
        let contact = req.body;
        console.log("ID: " + id);
        console.log(contact);
        MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
            if(err) throw err;
            let db = client.db("advizDB");
            db.collection('contacts').replaceOne({_id: ObjectId(id)}, contact, (err, result) => {
                if(err) throw err;
                res.sendStatus(204);
                client.close();
            });
        });
    })
    .delete((req, res) => {
        let id = req.params.id;  
        console.log(id);
        MongoClient.connect(url, {useUnifiedTopology: true}, (err, client) => {
            if(err) throw err;
            let db = client.db("advizDB");
            db.collection('contacts').deleteOne({_id: ObjectId(id)}, (err, result) => {
                if(err) throw err;
                res.sendStatus(204);
                client.close();
            });
        });
    });

module.exports = router;