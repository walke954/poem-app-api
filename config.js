exports.DATABASE_URL = process.env.DATABASE_URL ||
                      'mongodb://local:local1@ds133621.mlab.com:33621/poem-app-api';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
                      'mongodb://localhost/poem-app-testDb';
exports.PORT = process.env.PORT || 8080;

exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'https://poem-app-2322.herokuapp.com/';

exports.JWT_SECRET = process.env.JWT_SECRET || 'Your_My_Best_Friend';

exports.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';