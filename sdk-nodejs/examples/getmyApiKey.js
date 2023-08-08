const { refreshToken } = require("../getApiToken");

refreshToken()
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
