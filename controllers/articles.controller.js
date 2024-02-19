const { selectArticle } = require('../models/articles.model');

exports.getArticle = (request, response, next) => {
    const articleId = request.params.article_id;
    selectArticle(articleId)
    .then(({ rows }) => {
        if (rows.length === 0) {
            next({ status: 404, msg: 'not found' });
        }
        response.status(200).send({ article: rows[0] });
    })
    .catch(next);
};