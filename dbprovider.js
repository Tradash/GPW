const fs = require('fs');
const fsp = require('fs').promises;
//const btoa = require('btoa');

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const buffer = require('buffer');
const sharp = require('sharp');
var level = require('level');
const crypto = require('crypto');

const url = 'mongodb://localhost:27017';
const dbUrl = 'localhost';
const dbPort = 27017;
const dbName = 'Test';
const collName = 'Garden_Plant';
const collTmp = 'temp_pict';
const collDB = 'GardenDB';
const collUser = 'UserData';

const levelDB='./ldb';



//Поиск пользователя в БД 
const findUser = async(name) => {
	let result = {data:null, err: null};
	let db;
 	try {
		db = level(levelDB, {valueEncoding: 'json'});
		result.data = await db.get(name);
	}
	catch (err) { result.err = err; };
	db.close();
	return result;
};

// Добавление пользователя в БД
const addUser = async (name, password) => {
	let result = {data:null, err: null};
	let db, salt, hashPassword;
	try {
		db = level(levelDB, {valueEncoding: 'json'});
		salt = Math.round((new Date().valueOf() * Math.random()))+'';
		hashPassword = crypto.createHash('sha512').update(salt+password).digest('hex');
		result.data = await db.put(name, {salt: salt, psw: hashPassword });
	}
	catch (err) { result.err = err; };
	db.close();
	return result;
};
// Удаление пользователя из БД

const delUser = async (name) => {
	let result = {data:null, err: null};
	try {
		db = level(levelDB, {valueEncoding: 'json'});
		result.data = await db.del(name);
	}
	catch (err) { result.err = err; };
	db.close();
	return result;
}


const read_pict = (buff) => {
	return new Buffer(buff).toString('base64');
};
// Загрузка изображения в буфер и проведение ресайзинга
const loadFR = (name) => {
	const prms = name.map(elem => sharp(elem).resize(300,300).max().toBuffer());
	return Promise.all(prms);
}

// Функция-обертка для подключения к БД
const doItDB = (func) => {
	MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
		if (err) { 
						const error = new Error('Ошибка при соединении с БД');
						error.httpStatusCode = 400;
						return func(error);} 
		const db = client.db(dbName); 
		func(null, db, client);
	});
};

module.exports = {
	doItDB: doItDB,
	read_pict: read_pict,
	collName: collName,
	collTmp: collTmp,
	loadFR: loadFR,
	url: url,
	dbName: dbName,
	collUser: collUser,
	findUser: findUser,
	addUser: addUser,
	delUser: delUser
}
