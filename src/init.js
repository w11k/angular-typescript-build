// global libs

require("lodash");
require("angular");
require("angular-cookies");
require("angular-sanitize");
require("angular-animate");
require("angular-ui-router");
require("angular-bootstrap");


// app modules

require("./app");
require("./routes");
require("./home/HomeService");
require("./home/HomeController");
require("./legacy/LegacyService");


// Bootstrap Angular

angular.bootstrap(document, ["app"], {strictDi: false});
