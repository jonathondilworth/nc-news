const db = require('../db/connection');

exports.selectArticle = (id) => {
    return db.query(`
        SELECT * FROM articles 
        WHERE article_id = $1
    `, [id])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows[0];
    });
};

exports.selectArticles = () => {
    return db.query(`
        SELECT 
            articles.article_id, 
            articles.title, 
            articles.topic, 
            articles.author, 
            articles.created_at, 
            articles.votes, 
            articles.article_img_url, 
            COUNT(comments.comment_id)::INT AS comment_count FROM articles
        LEFT JOIN comments ON articles.article_id = comments.article_id
        GROUP BY articles.article_id
        ORDER BY articles.created_at DESC
    `)
    .then(({ rows }) => {
        return rows;
    });
};

exports.updateArticleVotes = (id, voteCount) => {
    return db.query(`
        UPDATE articles
        SET votes = votes + $1
        WHERE article_id = $2
        RETURNING *
    `, [voteCount, id])
    .then(({ rows }) => {
        return rows[0];
    });
};