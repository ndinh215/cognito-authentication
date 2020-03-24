const request = require('request');
const jwkToPem = require('jwk-to-pem')
const jwt = require('jsonwebtoken')

exports.Validate = function (req, res, next) {
    let token = req.header.authentication;
    const userPoolId = 'us-east-1_ujnSFe4tP';
    const pool_region = 'US-EAST-1'

    request({
        url: `https://cognitoidp.${pool_region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            pems = {};
            var keys = body['keys'];
            for (var i = 0; i < keys.length; i++) {
                var key_id = keys[i].kid;
                var modulus = keys[i].n;
                var exponent = keys[i].e;
                var key_type = keys[i].kty;
                var jwk = { kty: key_type, n: modulus, e: exponent };
                var pem = jwkToPem(jwk);
                pems[key_id] = pem;
            }
            var decodedJwt = jwt.decode(token, { complete: true });
            if (!decodedJwt) {
                console.log("Not a valid JWT token");
                res.status(400).send('Not a valid JWT token');
            }
            var kid = decodedJwt.header.kid;
            var pem = pems[kid];
            if (!pem) {
                console.log('Invalid token');
                res.status(400).send('Invalid token');
            }
            jwt.verify(token, pem, function (err, payload) {
                if (err) {
                    console.log("Invalid Token.");
                    res.status(400).send('Invalid token');
                } else {
                    console.log("Valid Token.");
                    next();
                }
            });
        } else {
            console.log("Error! Unable to download JWKs");
            res.status(405000).send(error);
        }
    });


}