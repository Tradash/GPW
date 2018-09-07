var express = require('express');
var router = express.Router();
const doItDB = require('../dbprovider.js').doItDB;
const collName = require('../dbprovider.js').collName;
let myquery;

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  res.render('user', { 
  	title: 'Есть такой пользователь:'+req.params.id, 
  	home: '/user/'+ req.params.id+'/',
  	countplants: 50,
  	counttypeplants: 20,
  	summoney: 34000
  });
});

router.get('/:id/new', function(req, res, next) {
	if(req.query.f) { //Установлен фильтр
		myquery = {'$or': [ {name: { '$regex' : req.query.f, '$options': 'i' }}, 
											  {name_lat: { '$regex' : req.query.f, '$options': 'i' }}]};	
	} else { myquery = {}; };
	doItDB((err, db, cli)=>{
		db.collection(collName).find(myquery).toArray(function(err, cursor){
			if (err) {
						const error = new Error('Ошибка при выборке в БД растений');
						error.httpStatusCode = 400;
						return nexr(error);}
			res.render('addPlant', {
				home: '/user/'+ req.params.id+'/new/',
				cursor: cursor,
				usersel: req.query.p ? true: false
				});
		});
	})

});
module.exports = router;
