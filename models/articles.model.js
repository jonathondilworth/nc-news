const db = require('../db/connection');

exports.selectArticle = (id) => {
    return db.query('SELECT * FROM articles WHERE article_id = $1', [id]);
};