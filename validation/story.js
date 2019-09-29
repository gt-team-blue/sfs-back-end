const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data) {
    let errors = {};

    data.title = !isEmpty(data.title) ? data.title : "";
    data.creatorEmail = !isEmpty(data.creatorEmail) ? data.creatorEmail : "";

    if (Validator.isEmpty(data.title)) {
        errors.title = "Title field is required";
    }
    if (Validator.isEmpty(data.creatorEmail)) {
        errors.creatorEmail = "Creator email field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
