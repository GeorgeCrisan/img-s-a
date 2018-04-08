
const express = require('express');
const moment = require('moment');
const request = require('request');
const rp = require('request-promise');
const cors = require('cors');
const mongodb = require('mongodb'); 

const app = express();

app.use(cors());

let MongoClient = mongodb.MongoClient;


app.use(express.static(__dirname + '/public'));

app.get('/',(req,res)=>{

  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/latest',(req,res)=>{
      MongoClient.connect(process.env.DB_URL,(err,db)=>{
            if(err) throw err;
       let dbo = db.db('url-short-rdp');
        dbo.collection('search-history').find({}).project({_id: 0}).toArray((err,result)=>{
                      
             res.json(result);
            db.close();
        
        });        
      });              
});

app.get('/api/search?(*)',(req,res)=>{
       let toOutput = {};
       let queryTerm = req.query.q;
       let offset = req.query.offset;
       //console.log(offset);
       let urlToQuery = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.G_APIKEY +  '&cx=' + process.env.G_ID + '&q=' + queryTerm + '&searchType=image' + '&startPage=' + offset + '&fields=items(link,snippet,image/thumbnailLink,image/contextLink)';

      //here is an http request
       rp(urlToQuery).then(function(data){
          //console.log(data);
            toOutput = data;
          let objToHistory = {term: queryTerm , when:  moment().format('DD-MMMM-YYYY  HH:mm:ss a')};
          
        MongoClient.connect(process.env.DB_URL,(err,db)=>{
                 if (err) throw err;
          
          let dbo = db.db('url-short-rdp');
          dbo.createCollection('search-history',(err)=>{
            if (err) throw err;
            
          });
          
          dbo.collection('search-history').insertOne(objToHistory,(err,res)=>{
             if(err) throw err;
            db.close();
          });
          
        
        }); 
         
       }).then(()=>{
         
          res.send("<pre>"+ toOutput + "</pre>");
       
       });
     
  
});

app.listen(process.env.PORT,(listener)=> console.log( process.env.PORT));