

// app modules

require("./appModule");
require("./routes");
require("./home/HomeService");
require("./home/HomeController");
require("./legacy/LegacyService");


// Bootstrap Angular

angular.bootstrap(document, ["app"], {strictDi: false});
