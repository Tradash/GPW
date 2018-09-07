var express = require('express');
var router = express.Router();
var level = require('level');
const crypto = require('crypto');
const levelDB='./ldb';
let salt;
let hashPassword;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function(req, res, next) {
	const db = level(levelDB, {valueEncoding: 'json'});
	if (req.body.newname) { //Если новый пользователь
		console.log('=== new user');
		db.get(req.body.newname, function (err, value) {
			console.log('===', err, value);
			if (err) {
				if (err.notFound) {
				// Записываем новую запись в БД
				salt = Math.round((new Date().valueOf() * Math.random()))+'';
				hashPassword = crypto.createHash('sha512').update(salt+req.body.psw).digest('hex');
				db.put(req.body.newname, {salt: salt, psw: hashPassword });
				db.close();
				res.render('index', { title: 'Создан пользователь:'+req.body.newname+', Удачи' });
				} 
				
			}
			else {
					db.close();
					res.render('index', { title: 'Имя:'+req.body.newname+' уже используется. Попробуйте другое имя.'});
				}
		})
	
	}
	else { // Проверка регистрации
		if (req.body.uname) {
			db.get(req.body.uname, function (err, value) {
				db.close();
				if (err) {
					if (err.notFound) { // Если нет такого пользователя
						res.render('index', { title: 'Неправильное имя пользователя или пароль' });
					}
				}
				else { // Проверка пароля
					salt = value.salt;
					hashPassword = crypto.createHash('sha512').update(salt+req.body.psw).digest('hex');
					if (hashPassword === value.psw) {
						res.redirect('/user/'+req.body.uname);
					}
					else {
						res.render('index', { title: 'Неправильное имя пользователя или пароль' });
					}
				}
			});
		}	
	}
	
//  res.render('index', { title: 'Получен новый пользователь' });
})
module.exports = router;
