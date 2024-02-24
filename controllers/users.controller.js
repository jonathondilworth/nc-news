const { selectUsers, selectUserByUsername } = require("../models/users.model");

exports.getUsers = (request, response, next) => {
    return selectUsers()
    .then((result) => {
        response.status(200).send({ users: result });
    })
    .catch(next);
};

exports.getUser = (request, response, next) => {
    const { username } = request.params;
    return selectUserByUsername(username)
    .then((result) => {
        response.status(200).send({ user: result });
    })
    .catch(next);
};