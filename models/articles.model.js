const db = require('../db/connection');

exports.selectArticle = (id) => {
    return db.query(`
        SELECT articles.*, COUNT(comments.comment_id)::INT AS comment_count FROM articles
        LEFT JOIN comments ON articles.article_id = comments.article_id
        WHERE articles.article_id = $1
        GROUP BY articles.article_id
    `, [id])
    .then(({ rows }) => {
        return rows.length === 0
            ? Promise.reject({ status: 404, msg: 'not found' })
            : rows[0];
    });
};

/**
 * I was getting an intermittent error occuring (detected deadlock) for some tests
 * when selectArticle was updated to use a JOIN, this is a temporary work-around &
 * TODO: implement a checkExists (generic-type) utils function
 */
exports.checkArticleExists = (id) => {
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

exports.selectArticles = (topic, sort_by = 'created_at', order = 'desc') => {
    
    const validSortBys = ['article_id', 'title', 'topic', 'author', 'created_at', 'votes'];
    const validOrders = ['asc', 'desc'];

    if (!validSortBys.includes(sort_by) && !validOrders.includes(order.toLowerCase())) {
        return Promise.reject({ status: 400, msg: 'bad request' });
    }

    const queryVals = [];
    
    let queryString = `
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
    `;
    
    if (topic) {
        queryString += ` WHERE topic = $1 `;
        queryVals.push(topic);
    }

    queryString += ` GROUP BY articles.article_id `;
    queryString += ` ORDER BY articles.${sort_by} ${order} `;

    return db.query(queryString, queryVals)
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