var express = require('express');
var router = express.Router();
const doItDB = require('../dbprovider.js').doItDB;
const collName = require('../dbprovider.js').collName;
const collUser = require('../dbprovider.js').collUser;
const getIdFromToken = require('../passport.js').getIdFromToken;
const mongodb = require('mongodb');
let myquery, ma, i, mq, cd;

/* GET users listing. */
router.get('/', function(req, res, next) {
	const id = getIdFromToken(req);
	doItDB((err, db, cli)=>{
		// Получаем список всех расстений попадающих в фильтр
		db.collection(collUser).aggregate([
			{ $match: {'fuser': id }},
			{ $group: { _id: "$fid", 
									colplant: { $sum: "$fvol"}, 
									totalsum: { $sum: {$multiply: ['$fvol', '$fprice']}}}
			}])
			.toArray(function(err, pc){
			// Создаем фильтр для выборки из основной базы.
				ma = [];
				for(i=0; i < pc.length; i+=1) {
					ma.push({ _id: new mongodb.ObjectID(pc[i]._id)});
				};
				if(req.query.f) { //Установлен фильтр пользователем
					myquery = {'$or': [ {name: { '$regex' : req.query.f, '$options': 'i' }}, 
												  {name_lat: { '$regex' : req.query.f, '$options': 'i' }}]};
					mq = {'$and': [myquery, {'$or': ma}]};		
				} else { 
					myquery = {};
					mq = {'$or': ma};
				};
				db.collection(collName).find(mq).toArray(function(err, mainbd) {
					const obRes = mainbd.reduce((result, elem)=> {
					const f = pc.filter(el=> (el._id === elem._id.toString()));
					const newE = { 	id: elem._id,
													name: elem.name,
													name_lat: elem.name_lat,
													url: elem.url,
													img: elem.img,
													colplant: f[0].colplant,
													totalsum: f[0].totalsum };
					return [...result, newE];	},[]);
				res.render('user', { 
	  			title: 'Есть такой пользователь:'+id, 
			  	home: '/user/'+ id+'/',
	  			countplants: pc.reduce((aggr, elem) => aggr+elem.colplant,0),
	  			counttypeplants: pc.length,
	  			summoney: pc.reduce((aggr, elem) => aggr+elem.totalsum,0),
	  			cursor: obRes,
	  		});
			});			
		});
	});
});

router.get('/addplant', function(req, res, next) {
	const id = getIdFromToken(req);
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
				home: '/user/'+ id+'/',
				user: id,
				cursor: cursor,
				usersel: req.query.p ? true: false
				});
		});
	})
});

router.post('/addplant', function(req, res, next) {
	//console.log('===',req.body);
	const rec = {
		fid: req.body.fid, 
		fuser: req.body.fuser,
		fsource: req.body.fsource,
		ffrom: req.body.ffrom,
		fdate: req.body.fdate,
		fvol: Number(req.body.fvol),
		fprice: Number(req.body.fprice)
	};
	doItDB((err, db, cli)=>{
		db.collection(collUser).insertOne(rec, (err, rez) => {
			if (err) {
				const error = new Error('Ошибка при сохранении нового поступления');
				error.httpStatusCode = 400;
				return next(error);}
			res.redirect('/user')				
		});
	});
})

router.get('/delplant', function(req, res, next) {
	const id = getIdFromToken(req);
	if (!req.query.p)	{return res.redirect('/user')	} // Если не передан параметр выходим
	myquery = { _id: new mongodb.ObjectID(req.query.p) };
	//Выбираем данные по расстению
	doItDB((err, db, cli)=>{
		db.collection(collName).find(myquery).toArray(function(err, cursor){
			if (err) {
				const error = new Error('Ошибка, не найдено расстение в БД');
				error.httpStatusCode = 400;
				return next(error);}
			// Выбираем данные по движению с группировкой
			db.collection(collUser).aggregate([
				{ $match: { $and: [{'fuser': id }, {'fid': req.query.p}]}},
				{ $group: { _id: "$fid", 
										colplant: { $sum: "$fvol"}, 
										totalsum: { $sum: {$multiply: ['$fvol', '$fprice']}}}
			}])
			.toArray(function(err, detail){
				res.render('delPlant', {
					cursor: cursor[0],
					detail: detail[0]
				});
			});
		});
	});
});
module.exports = router;
