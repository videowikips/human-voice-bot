const request = require('request')
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const { exec } = require('child_process')

const oauth = OAuth({
  consumer: {
    key: process.env.MEDIAWIKI_CONSUMER_KEY,
    secret: process.env.MEDIAWIKI_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function (baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

function fetchCSRFToken(wikiSource, tokenData, callback = () => {}) {
  return new Promise((resolve, reject) => {
    const requestData = {
      url: `${wikiSource}/w/api.php?action=query&meta=tokens&type=csrf&format=json`,
      method: 'POST',
    }
    console.log(wikiSource, tokenData, requestData)
    request({
      url: requestData.url,
      method: requestData.method,
      headers: oauth.toHeader(oauth.authorize(requestData, tokenData)),
    }, (err, response, body) => {
      if (err) {
        reject(err)
        return callback(err)
      }
      const parsedBody = JSON.parse(body);
      const csrfToken = parsedBody.query.tokens.csrftoken;
      resolve(csrfToken);
      return callback(null, csrfToken)
    })
  });  
}

function prependArticleText(title, wikiSource, key, secret, prependtext, callback = () => {}) {
  const tokenData = {
    key,
    secret,
  }

  return new Promise((resolve, reject) => {
    fetchCSRFToken(wikiSource, tokenData)
    .then((csrfToken) => {
      const requestData = {
        url: `${wikiSource}/w/api.php?action=edit&nocreate=true&format=json`,
        method: 'POST',
        formData: {
          title,
          prependtext,
          contentformat: 'text/x-wiki',
          token: csrfToken,
          minor: 'true',
        },
      }
      console.log(requestData)
      // perform upload
      request({
        url: requestData.url,
        method: requestData.method,
        formData: requestData.formData,
        headers: oauth.toHeader(oauth.authorize(requestData, tokenData)),
      }, (err, response, body) => {
        console.log('bpdy', body);
        const parsedBody = JSON.parse(body);
        if (err) {
          reject(err);
          return callback(err);
        }
        if (parsedBody.error) {
          reject(parsedBody.error);
          return callback(parsedBody.error);
        }

        if (parsedBody.edit && parsedBody.edit.result.toLowerCase() === 'success') {
          resolve(parsedBody.edit);
          return callback(null, parsedBody.edit);
        } else {
          reject(parsedBody.edit);
          return callback(parsedBody.edit);
        }
      })
    })
    .catch((err) => reject(err) && callback(err));
  })
}

module.exports = {
  prependArticleText,
  fetchCSRFToken,
}