var express = require('express');
var router = express.Router();
const doItDB = require('../dbprovider.js').doItDB;
const collName = require('../dbprovider.js').collName;
const collUser = require('../dbprovider.js').collUser;
let myquery, ma, i, mq, cd;

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	if(req.query.f) { //Установлен фильтр
		myquery = {'$or': [ {name: { '$regex' : req.query.f, '$options': 'i' }}, 
											  {name_lat: { '$regex' : req.query.f, '$options': 'i' }}]};	
	} else { myquery = {}; };
	doItDB((err, db, cli)=>{
		// Получаем список всех расстений попадающих в фильтр
		db.collection(collName).find(myquery).toArray(function(err, pc){
			if (err) {
				const error = new Error('Ошибка при выборке в БД растений');
				error.httpStatusCode = 400;
				return nexr(error);}
			// Подготовка запроса по данным пользователя
			ma = [];
			for (i=0; i<pc.length; i++ ) {
				ma = [...{ fid: {'$regex' : pc._id }}];
			}
			mq = {'$and': [{'$or': ma}, { fuser: req.params.id}]};
			db.collection(collUser).find(mq).toArray(function(err, uc){
				if (err) {
					const error = new Error('Ошибка при выборке в БД пользовательских растений');
					error.httpStatusCode = 400;
					return nexr(error);}
				});
				// Готовим объект для выгрузки клиенту
				cd = [];
				cd = uc.map((elem)=>{
					 
				})
				
		});
	});
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
				home: '/user/'+ req.params.id+'/',
				user: req.params.id,
				cursor: cursor,
				usersel: req.query.p ? true: false
				});
		});
	})
});

router.post('/:id/new', function(req, res, next) {
	const cName = req.params.id;
	//console.log('===',req.body);
	const rec = {
		fid: req.body.fid, 
		fuser: req.body.fuser,
		fsource: req.body.fsource,
		ffrom: req.body.ffrom,
		fdate: req.body.fdate,
		fvol: req.body.fvol,
		fprice: req.body.fprice
	};
	doItDB((err, db, cli)=>{
		db.collection(collUser).insertOne(rec, (err, rez) => {
			if (err) {
				const error = new Error('Ошибка при сохранении нового поступления');
				error.httpStatusCode = 400;
				return nexr(error);}
			res.redirect('/user/'+cName+'/')				
		});
	});
})
module.exports = router;
