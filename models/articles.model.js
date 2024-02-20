const db = require('../db/connection');

exports.selectArticle = (id) => {
    return db.query('SELECT * FROM articles WHERE article_id = $1', [id]);
};

exports.selectArticles = () => {
    return db.query(
        `SELECT articles.*, COUNT(comments.comment_id) AS comment_count FROM articles
         LEFT JOIN comments ON articles.article_id = comments.article_id
         GROUP BY articles.article_id`
    );
};