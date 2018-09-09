const fs = require('fs');
const fsp = require('fs').promises;
//const btoa = require('btoa');

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const buffer = require('buffer')
const sharp = require('sharp');

const url = 'mongodb://localhost:27017';
const dbUrl = 'localhost';
const dbPort = 27017;
const dbName = 'Test';
const collName = 'Garden_Plant';
const collTmp = 'temp_pict';
const collDB = 'GardenDB';
const collUser = 'UserData';


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
	collUser: collUser
}
