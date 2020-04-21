const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const path = require('path');
const PORT = process.env.PORT || 3000


let lastMove = null
let game = {
  player1: {
    connected: false,
    color: 'white',
    observate: false,
    move: true
  },
  player2: {
    connected: false,
    color: 'black',
    observate: false,
    move: false
  },
  checkers: [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
  ]
}


const httpServer = http.createServer(requestResponseHandler);

httpServer.listen(PORT, () => {
  console.log('Node.JS static file server is listening on port 3000')
})

function requestResponseHandler(request, response) {
  //console.log(`Request came: ${request.url}`);
  if (request.method === "GET") {
    if (request.url === '/') {
      sendResponse('index.html', 'text/html', response)
    } else {
      sendResponse(request.url, getContentType(request.url), response);
    }
  } else if (request.method === "POST") {
    let body = ""
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      const post = querystring.parse(body);
      switch (post.action) {
        case "RESET_SERVER":
          game = {
            player1: {
              connected: false,
              color: 'white',
              observate: false,
              move: true
            },
            player2: {
              connected: false,
              color: 'black',
              observate: false,
              move: false
            },
            checkers: [
              [0, 1, 0, 1, 0, 1, 0, 1],
              [1, 0, 1, 0, 1, 0, 1, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0, 0, 0],
              [0, 2, 0, 2, 0, 2, 0, 2],
              [2, 0, 2, 0, 2, 0, 2, 0],
            ]
          }
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.write('true')
          response.end()
          break;
        case "NEW_USER":
          if (game.player1.name === post.name || game.player2.name === post.name) {
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify({ isSameName: true }))
          } else if (!game.player1.connected) {
            game.player1.connected = true
            game.player1.id = post.id
            game.player1.name = post.name
            const obj = {
              player: game.player1,
              checkers: game.checkers,
              player2: game.player2
            }
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify(obj))
          } else if (!game.player2.connected) {
            game.player2.connected = true
            game.player2.id = post.id
            game.player2.name = post.name
            const obj = {
              player: game.player2,
              checkers: game.checkers,
              player2: game.player1
            }
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify(obj))
          } else {
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify({ observate: true, checkers: game.checkers }))
          }
          response.end();
          break;
        case "LEAVE_USER":
          if (game.player1.id === post.id) {
            game.player1.connected = false
          } else if (game.player2.id === post.id) {
            game.player2.connected = false
          }
          break;
        case "CHECK_SECOND_PLAYER":
          const obj = {}
          if (game.player1.id === post.id) {
            if (game.player2.connected) {
              obj.player2 = {
                name: game.player2.name
              }
            }
          }
          if (game.player2.id === post.id) {
            if (game.player1.connected) {
              obj.player2 = {
                name: game.player1.name
              }
            }
          }
          response.writeHead(200, { 'Content-Type': 'application/json' })
          response.write(JSON.stringify(obj))
          response.end()
          break;
        case "CHECK_WHITE_MOVE":
        case "CHECK_BLACK_MOVE":
          if (game.player1.connected && game.player2.connected) {
            const move = JSON.parse(post.move)
            if (move) lastMove = move
            game.checkers[move.from.y][move.from.x] = 0
            game.checkers[move.to.y][move.to.x] = 2
            if (post.action === "CHECK_BLACK_MOVE") {
              game.player1.move = true
              game.player2.move = false
            } else {
              game.player1.move = false
              game.player2.move = true
            }
            response.writeHead(200, { 'Content-Type': 'application/json' })
            response.write(JSON.stringify({ success: true }))
            response.end()
          } else {
            response.write("reload")
            response.end()
          }
          break;
        case "CHECK_IS_MY_MOVE":
          if (game.player1.connected && game.player2.connected) {
            response.writeHead(200, { 'Content-Type': 'application/json' })
            if (post.id === game.player1.id) response.write(JSON.stringify({ myMove: game.player1.move, lastMove: lastMove }))
            if (post.id === game.player2.id) response.write(JSON.stringify({ myMove: game.player2.move, lastMove: lastMove }))
            response.end()
          } else {
            response.write("reload")
            response.end()
          }
          break;
        default:
          break;
      }

    });
  }
}

function sendResponse(url, contentType, res) {
  let file = path.join(__dirname, "static", url);
  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.write(`File '${file}' Not Found!`);
      res.end();
      //console.log(`Response: 404 ${file}, err`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.write(content);
      res.end();
      //console.log(`Response: 200 ${file}`);
    }
  })
}

function getContentType(url) {
  switch (path.extname(url)) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'text/javascript';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpeg';
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octate-stream';
  }
}