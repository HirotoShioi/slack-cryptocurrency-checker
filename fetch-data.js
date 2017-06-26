const request = require('request');
// Fetch data from external api
const fetchData = url => {
  const result = new Promise((resolve, reject) =>{
    require('request')(url, (error, response, body) => {
      if(!error){
        resolve(JSON.parse(body));
      } else {
        reject(JSON.parse(error));
      }
    });
  });
  return result;
};

module.exports = {
  fetchData
};