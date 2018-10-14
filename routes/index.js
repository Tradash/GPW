var express = require('express');
var router = express.Router();
var level = require('level');
const crypto = require('crypto');
const levelDB='./ldb';
const findUser=require('../dbprovider.js').findUser;
const addUser=require('../dbprovider.js').addUser;
let salt;
let hashPassword;

/* GET home page. */
router.get('/', function(req, res, next) {
  req.ioInfo.emit('broadcast', (new Date()).toUTCString() + ' '+req.connection.remoteAddress+' - На сайт зашел незарегистрированный пользователь');
  res.render('index', { title: 'Мой Сад',
      inform: 'Войдите под своей учетной записью или пройдите регистрацию для получения учетной записи.' });
});

module.exports = router;
