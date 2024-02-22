const { selectUsers } = require("../models/users.model");

exports.getUsers = (request, response, next) => {
    return selectUsers()
    .then((result) => {
        response.status(200).send({ users: result });
    })
    .catch(next);
};