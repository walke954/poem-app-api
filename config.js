require('dotenv').load();

exports.DATABASE_URL = process.env.DATABASE_URL;
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
                      'mongodb://localhost/poem-app-testDb';
exports.PORT = process.env.PORT || 8080;

exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://cloudpoetry.site';

exports.JWT_SECRET = process.env.JWT_SECRET;

exports.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';