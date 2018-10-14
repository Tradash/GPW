const express = require('express');
// eslint-disable-next-line
const router = express.Router();
const doItDB = require('../dbprovider.js').doItDB;
const collName = require('../dbprovider.js').collName;
const collUser = require('../dbprovider.js').collUser;
const getIdFromToken = require('../passport.js').getIdFromToken;
const delUser = require('../dbprovider.js').delUser;
const mongodb = require('mongodb');
let myquery; let ma; let i; let mq;

/* GET users listing. */
router.get('/', function(req, res, next) {
  const id = getIdFromToken(req);
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь открыл основную страницу сайта');
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    // Получаем список всех расстений попадающих в фильтр
    db.collection(collUser).aggregate([
      {$match: {'fuser': id}},
      {$group: {_id: '$fid',
        colplant: {$sum: '$fvol'},
        totalsum: {$sum: {$multiply: ['$fvol', '$fprice']}}},
      }])
        .toArray(function(err, pc) {
        	if (err) {
        		const error = new Error('Ошибка при доступе к БД');
        		error.httpStatusCode = 400;
        		return nexr(error);
      		}
          if (pc.length === 0) { // У юзера нет записей
            res.render('user', {
              title: 'Есть такой пользователь:'+id,
              home: '/user/'+ id+'/',
              countplants: 0,
              counttypeplants: 0,
              summoney: 0,
              cursor: [],
            });
          } else {
            // Создаем фильтр для выборки из основной базы.
            ma = [];
            for (i=0; i < pc.length; i+=1) {
              ma.push({_id: new mongodb.ObjectID(pc[i]._id)});
            }
            if (req.query.f) { // Установлен фильтр пользователем
              myquery = {'$or': [
                {name: {'$regex': req.query.f, '$options': 'i'}},
                {name_lat: {'$regex': req.query.f, '$options': 'i'}}]};
              mq = {'$and': [myquery, {'$or': ma}]};
            } else {
              myquery = {};
              mq = {'$or': ma};
            }
            db.collection(collName).find(mq).toArray(function(err, mainbd) {
            	if (err) {
        				const error = new Error('Ошибка при доступе к БД');
        				error.httpStatusCode = 400;
        				return nexr(error);
      				}
              const obRes = mainbd.reduce((result, elem)=> {
                const f = pc.filter((el)=> (el._id === elem._id.toString()));
                const newE = {id: elem._id,
                  name: elem.name,
                  name_lat: elem.name_lat,
                  url: elem.url,
                  img: elem.img,
                  colplant: f[0].colplant,
                  totalsum: f[0].totalsum};
                return [...result, newE];
              }, []);
              res.render('user', {
                title: 'Есть такой пользователь:'+id,
                home: '/user/'+ id+'/',
                countplants: pc.reduce((aggr, elem) => aggr+elem.colplant, 0),
                counttypeplants: pc.length,
                summoney: pc.reduce((aggr, elem) => aggr+elem.totalsum, 0),
                cursor: obRes,
              });
            });
          }
        });
  });
});

router.get('/addplant', function(req, res, next) {
  const id = getIdFromToken(req);
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь добавляет растение');
  if (req.query.f) { // Установлен фильтр
    myquery = {'$or': [
      {name: {'$regex': req.query.f, '$options': 'i'}},
      {name_lat: {'$regex': req.query.f, '$options': 'i'}}]};
  } else {
    myquery = {};
  }
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collName).find(myquery).toArray(function(err, cursor) {
      if (err) {
        const error = new Error('Ошибка при выборке в БД растений');
        error.httpStatusCode = 400;
        return next(error);
      }
      res.render('addPlant', {
        home: '/user/'+ id+'/',
        user: id,
        cursor: cursor,
        usersel: req.query.p ? true: false,
      });
    });
  });
});

router.post('/addplant', function(req, res, next) {
  // console.log('===',req.body);
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь добавил растение');
  const rec = {
    fid: req.body.fid,
    fuser: req.body.fuser,
    fsource: req.body.fsource,
    ffrom: req.body.ffrom,
    fdate: req.body.fdate,
    fvol: Number(req.body.fvol),
    fprice: Number(req.body.fprice),
  };
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collUser).insertOne(rec, (err, rez) => {
      if (err) {
        const error = new Error('Ошибка при сохранении нового поступления');
        error.httpStatusCode = 400;
        return next(error);
      }
      res.redirect('/user');
    });
  });
});

router.get('/delplant', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь оформляет выбытие растения');
  const id = getIdFromToken(req);
  if (!req.query.p) {
    return res.redirect('/user');
  } // Если не передан параметр выходим
  myquery = {_id: new mongodb.ObjectID(req.query.p)};
  // Выбираем данные по расстению
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collName).find(myquery).toArray(function(err, cursor) {
      if (err) {
        const error = new Error('Ошибка, не найдено расстение в БД');
        error.httpStatusCode = 400;
        return next(error);
      }
      // Выбираем данные по движению с группировкой
      db.collection(collUser).aggregate([
        {$match: {$and: [{'fuser': id}, {'fid': req.query.p}]}},
        {$group: {_id: '$fid',
          colplant: {$sum: '$fvol'},
          totalsum: {$sum: {$multiply: ['$fvol', '$fprice']}}},
        }])
          .toArray(function(err, detail) {
            res.render('delPlant', {
              cursor: cursor[0],
              detail: detail[0],
              user: id,
            });
          });
    });
  });
});

router.post('/delplant', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь оформил выбытие растения');
  if (!req.query.p) {
    return res.redirect('/user');
  } // Если не передан параметр выходим
  const rec = {
    fid: req.query.p,
    fuser: getIdFromToken(req),
    fsource: req.body.fsource,
    ffrom: req.body.ffrom,
    fdate: req.body.fdate,
    fvol: Number(req.body.fvol)*(-1),
    fprice: 0,
  };
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collUser).insertOne(rec, (err, rez) => {
      if (err) {
        const error = new Error('Ошибка при сохранении нового выбытия');
        error.httpStatusCode = 400;
        return next(error);
      }
      res.redirect('/user');
    });
  });
});

router.get('/detail/:idd', function(req, res, next) {
  const id = getIdFromToken(req);
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь открыл детализацию растения');
  myquery = {_id: new mongodb.ObjectID(req.params.idd)};
  // Выбираем данные по расстению
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collName).find(myquery).toArray(function(err, cursor) {
      if (err) {
        const error = new Error('Ошибка, не найдено расстение в БД');
        error.httpStatusCode = 400;
        return next(error);
      }
      // Выбираем данные по движению
      db.collection(collUser).find(
          {$and: [{'fuser': id}, {'fid': req.params.idd}]})
          .toArray(function(err, detail) {
						if (err) {
        			const error = new Error('Ошибка при выполнении выборки операций');
        			error.httpStatusCode = 400;
			        return next(error);
			      }
            res.render('showDetail', {
              cursor: cursor[0],
              detail: detail,
              user: id,
              plantid: req.params.idd,
              colplant: detail.reduce((s, e)=>s+e.fvol, 0),
              sumplant: detail.reduce((s, e)=>s+e.fvol*e.fprice, 0),
            });
          });
    });
  });
});

router.get('/detail/:idd/delete/:idoper', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь удаляет операцию по растению');
  myquery = {_id: new mongodb.ObjectID(req.params.idoper)};
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collUser).deleteOne(myquery, function(err, cursor) {
      if (err) {
        const error = new Error('Ошибка при удалении операции');
        error.httpStatusCode = 400;
        return next(error);
      }
      res.redirect('/user/detail/'+req.params.idd);
    });
  });
});

router.get('/exit', function(req, res, next) {
  // Выход пользователя, отзываем куку
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь вышел из системы');
  res.clearCookie('jwt');
  res.redirect('/');
});

router.post('/deluser', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - Пользователь удаляет свою учетную запись');
  const id = getIdFromToken(req);
  myquery = {fuser: id};
  // Удаляем все записи операций пользователя
  doItDB((err, db, cli)=>{
  	if (err) {
      return next(err);
    }
    db.collection(collUser).deleteMany(myquery, function(err, cursor) {
      if (err) {
        const error = new Error('Ошибка при удалении операций пользователя');
        error.httpStatusCode = 400;
        return next(error);
      }
      delUser(id)
          .then((result) => {
            if (result.err) { // Ошибка при удалении учетки
              // eslint-disable-next-line
              const error = new Error('Ошибка при удалении учетки');
        			error.httpStatusCode = 400;
        			return next(error);
      			} else {
              res.redirect('/');
            }
          });
    });
  });
});
module.exports = router;
