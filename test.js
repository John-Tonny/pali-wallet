const CryptoJS = require('crypto-js');

var encryptedString =
  'U2FsdGVkX1++e7UgxFXx/O2RdwM2vi+o7QpEVPPw1mdhI+TnIUkdT6/V/55Zx+LCj7rDbsTzeycZBRkUVZqY8rND0LaUGEAspjF67ghS1NCN7Mpg4q4WmsYYkiZ3CP1Am3HOXX9KJfwYGazK3ethCoTGbi9WkBfj47v94ZEkiJU=';
var key = '';
var bbb = CryptoJS.AES.decrypt(encryptedString, key);

var ccc = bbb.toString(CryptoJS.enc.Utf8);

console.log(bbb);
console.log(ccc);
