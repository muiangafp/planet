var i18n = require('i18n');

i18n.configure({
  // setup some locales - other locales default to en silently
  locales:['pt', 'en'],

  // where to store json files - defaults to './locales' relative to modules directory
  directory: __dirname + '/locales',
  
  defaultLocale: 'en',
  
  // query parameter to switch locale (ie. /home?lang=ch) - defaults to NULL
  queryParameter: 'lang',

  // cookie
  cookie: 'locale'
});

module.exports = function(req, res, next) {

  i18n.init(req, res);


  var current_locale = i18n.getLocale();

  return next();
};