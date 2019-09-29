const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data) {
    let errors = {};

    data.title = !isEmpty(data.title) ? data.title : "";
    data.creator = !isEmpty(data.creator) ? data.creator : "";

    if (Validator.isEmpty(data.title)) {
        errors.title = "Title field is required";
    }
    if (Validator.isEmpty(data.creator)) {
        errors.email = "Email field is required";
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};
