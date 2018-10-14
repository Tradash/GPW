const MongoClient = require('mongodb').MongoClient;
const sharp = require('sharp');
const level = require('level');
const crypto = require('crypto');
const url = 'mongodb://localhost:27017';
const dbName = 'Test';
const collName = 'Garden_Plant';
const collTmp = 'temp_pict';
const collUser = 'UserData';

const levelDB='./ldb';

//Подсчет количества записей в коллекциях
const getRecordCount = (coll, cb) => {
  let result = 0
  doItDB((err, db, cli)=>{
    db.collection(coll !== 1 ? collUser: collName).countDocuments((err, recCount) => {
      if (!err) {
        result = recCount;
      }
      cb(result);
    });
  });
}

//Подсчет зарегистрированных пользователей в системе
const countUser = (id, cb) => {
  let result = {data: null, err: null};
  let db;
  var counter = 0;
  db = level(levelDB, {valueEncoding: 'json'});
  db.createReadStream()
    .on('data', () => { counter++ })
    .on('close', () => { db.close(); cb(result)})
    .on('end', () => { result.data = counter})
    .on('error', (err) => { console.log('error');  result.err = err; db.close(); cb(result)})
}

// Поиск пользователя в БД
const findUser = async (name) => {
  let result = {data: null, err: null};
  let db;
  try {
    db = level(levelDB, {valueEncoding: 'json'});
    result.data = await db.get(name);
  } catch (err) {
    result.err = err;
  };
  db.close();
  return result;
};

// Добавление пользователя в БД
const addUser = async (name, password) => {
  let result = {data: null, err: null};
  let db; let salt; let hashPassword;
  try {
    db = level(levelDB, {valueEncoding: 'json'});
    salt = Math.round((new Date().valueOf() * Math.random()))+'';
    hashPassword = crypto.createHash('sha512')
        .update(salt+password).digest('hex');
    result.data = await db.put(name, {salt: salt, psw: hashPassword});
  } catch (err) {
    result.err = err;
  };
  db.close();
  return result;
};

// Удаление пользователя из БД
const delUser = async (name) => {
  let result = {data: null, err: null};
  try {
    db = level(levelDB, {valueEncoding: 'json'});
    result.data = await db.del(name);
  } catch (err) {
    result.err = err;
  };
  db.close();
  return result;
};

// Конвертация буфера в текст
const readPict = (buff) => {
  return new Buffer(buff).toString('base64');
};

// Загрузка изображения в буфер и проведение ресайзинга
const loadFR = (name) => {
  const prms = name.map((elem) => sharp(elem)
      .resize(300, 300)
      .max().toBuffer());
  return Promise.all(prms);
};

// Функция-обертка для подключения к БД
const doItDB = (func) => {
  MongoClient.connect(url, {useNewUrlParser: true}, function(err, client) {
    if (err) {
      const error = new Error('Ошибка при соединении с БД');
      error.httpStatusCode = 400;
      return func(error);
    }
    const db = client.db(dbName);
    func(null, db, client);
  });
};

module.exports = {
  doItDB: doItDB,
  read_pict: readPict,
  collName: collName,
  collTmp: collTmp,
  loadFR: loadFR,
  url: url,
  dbName: dbName,
  collUser: collUser,
  findUser: findUser,
  addUser: addUser,
  delUser: delUser,
  countUser: countUser,
  getRecordCount: getRecordCount
};
