const http = require('http');
const fs = require('fs');

const port = 60053;
let responseRoutes = [];

/**
 * @return {Promise<*>}
 */
async function createTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const { url } = request;

      const resp = responseRoutes.find(respItem =>
        respItem.route === '*' ||
        url === respItem.route
      );

      if (!resp) {
        console.log(`Route ${url} not found`);
        response.statusCode = 404;
        response.end('Not Found');
        return;
      }

      response.statusCode = resp.code || 200;
      console.log(`Route ${url} responded with status code ${response.statusCode} ${resp.html}`);
      let respData = resp.html;
      if (resp.fn) {
        respData += `
            <script>
                (${resp.fn.toString()})();
            </script>
        `;
      }
      const headers = resp.headers || [];
      headers.forEach(({ name, value }) => response.setHeader(name, value));
      response.end(`
          <html>
          <head>
              <meta charset="utf-8">
          </head>
          <body>
              ${respData}
          </body>
          </html>
      `);
    });

    const finalizer = {
      close: async () => new Promise(res => server.close(() => res())),
    };
    server.listen(port, () => resolve(finalizer));
  });
}


/**
 * @typedef {object} ServerResponse
 * @property {?string} route
 * @property {string} html
 * @property {?function} fn
 */

/**
 * @param {ServerResponse|Array<ServerResponse>} response
 */
function setServerResponse(response) {
  if (!Array.isArray(response)) {
    responseRoutes = [{ route: '*', ...response }];
  } else {
    responseRoutes = response;
  }
}

function fileExists(path) {
  return new Promise(resolve => {
    fs.access(path, fs.F_OK, (err) => {
      if (err) {
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

function removeFile(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

module.exports = {
  fileExists,
  removeFile,
  setServerResponse,
  createTestServer,
  url: `http://localhost:${port}/`,
};
