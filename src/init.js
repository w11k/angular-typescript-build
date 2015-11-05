// Import ES6/TypeScript modules
require("./initModules");

// Load plain JavaScript 'script files'
require("./initScripts");

// Bootstrap Angular
angular.bootstrap(document, ["app"], {strictDi: true});
