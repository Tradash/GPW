const express = require('express');
// eslint-disable-next-line
const router = express.Router();
const findUser=require('../dbprovider.js').findUser;
const addUser=require('../dbprovider.js').addUser;

/* GET home page. */
router.post('/', (req, res, next) => {
  findUser(req.body.newname).then((result) => {
    if (result.err) {
      if (result.err.notFound) { // Нет такой учетки
        addUser(req.body.newname, req.body.psw)
            .then((result) => {
              if (result.err) { // Ошибка при добавление учетки
              	// eslint-disable-next-line
                res.render('index', {title: 'На сайте возникли технические проблемы, попробуйте зайти позже. '});
              } else {
                res.render('index', {title: 'Учетная запись создана. '});
              }
            });
  			} else {
  				// eslint-disable-next-line
  				res.render('index', {title: 'На сайте возникли технические проблемы, попробуйте зайти позже. '});
  			}
    } else {
    	// eslint-disable-next-line
  			res.render('index', {title: 'Имя:'+req.body.newname+' уже используется. Попробуйте другое имя. '});
  		}
  });
});

module.exports = router;
