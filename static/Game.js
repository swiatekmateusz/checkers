class Game {
  constructor() {
    this.board = [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
    ]
    this.net = null
    this.checkers = ""
    this.checkersObjects = []
    this.color = []
    this.focusedCheck = null
    this.gameStart = false
    this.isYourMove = false
    this.secondPlayer = null
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer();
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2()
    this.init()
    this.render()
  }
  init() {
    this.renderer.setClearColor(0x0066ff);
    this.renderer.setSize($(window).width(), $(window).height());
    this.camera.position.set(1200, 800, 0)
    this.camera.lookAt(this.scene.position);
    $("#root").append(this.renderer.domElement);

    let counter = 1
    for (let x = -350; x <= 350; x += 100) {
      for (let y = -350; y <= 350; y += 100) {
        var geometry = new THREE.BoxGeometry(100, 25, 100);
        var material = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          map: new THREE.TextureLoader().load(counter % 2 ? 'mats/black.jpg' : 'mats/white.jpg'),
          transparent: true,
          opacity: 1,

        })
        var cube = new THREE.Mesh(geometry, material);
        cube.position.x = y
        cube.position.y = 0
        cube.position.z = x
        this.scene.add(cube);
        counter++
      }
      counter++
    }

    $(window).on('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    })
    window.dispatchEvent(new Event('resize'));
  }

  secondPlayerJoined(secondPlayerName) {
    this.secondPlayer = secondPlayerName
    this.gameStart = true
    $('h2').text("Grasz z " + this.secondPlayer + ", " + (this.isYourMove ? "twój ruch" : "ruch przeciwnika"))
  }

  checkWin() {
    let whiteSum = 0
    let blackSum = 0
    this.checkers.forEach(item => {
      item.forEach(val => {
        if (val === 1) blackSum++
        if (val === 2) whiteSum++
      })
    });
    console.log(blackSum, whiteSum)
    if (whiteSum === 0) {
      if (this.color === "black") $('h2').text("Wygrałeś z " + this.secondPlayer)
      else $('h2').text("Przegrałeś z " + this.secondPlayer)
      this.gameStart = false
    }
    if (blackSum === 0) {
      if (this.color === "white") $('h2').text("Wygrałeś z " + this.secondPlayer)
      else $('h2').text("Przegrałeś z " + this.secondPlayer)
      this.gameStart = false
    }
  }

  swapMove(move) {
    this.isYourMove = true
    $('h2').text("Twój ruch")
    const { from, to } = move
    this.checkers[from.y][from.x] = 0
    this.checkers[to.y][to.x] = this.color === "white" ? 1 : 2
    const color = this.color === "white" ? "black" : "white"
    this.checkersObjects.forEach(item => {
      if (item.info.x === from.x && item.info.y === from.y) {
        item.info.color = ""
        item.material.opacity = 0
      }
      if (item.info.x === to.x && item.info.y === to.y) {
        item.material.map = new THREE.TextureLoader().load("mats/" + color + "check.jpg")
        item.material.opacity = 1
        item.info.color = color
      }
    })
    console.log(this.checkers)
    this.checkWin()
  }

  setCheckers(checkers, color = null, move = null, isWaitting, secondPlayerName) {
    if (secondPlayerName) {
      this.gameStart = true
      this.secondPlayer = secondPlayerName
    }
    this.checkers = checkers
    this.color = color
    this.isYourMove = move
    if (color === "white") {
      this.camera.position.set(-1200, 800, 0)
      this.camera.lookAt(this.scene.position);
    }
    if (this.isYourMove === null) $('h2').text("Obserwujesz")
    else if (this.isYourMove == false) {
      this.net.listenEnemyMove()
      $('h2').text("Ruch " + this.secondPlayer)
    }
    else $('h2').text("Twój ruch")
    if (isWaitting) $('h2').text("Oczekiwanie na drugiego gracza")

    this.checkers.forEach((row, i) => {
      row.forEach((column, j) => {
        if (this.board[j][i]) {
          var geometry = new THREE.CylinderGeometry(40, 40, 20, 32);
          let texture = ""
          let textureSrc = ""
          if (column === 1) texture = 'black'
          else if (column === 2) texture = 'white'
          if (column === 1 || column === 2) textureSrc = 'mats/' + texture + 'check.jpg'
          var material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: new THREE.TextureLoader().load(textureSrc),
            transparent: true,
            opacity: 1,
          })
          var cylinder = new THREE.Mesh(geometry, material);
          cylinder.info = { x: j, y: i, color: texture }
          cylinder.position.x = 350 - i * 100
          cylinder.position.y = 25
          cylinder.position.z = 350 - j * 100
          this.checkersObjects.push(cylinder)
          this.scene.add(cylinder);
        }

      })
    })


    $(document).mousedown(this.checkClick)

  }

  checkClick = event => {
    this.mouseVector.x = (event.clientX / $(window).width()) * 2 - 1;
    this.mouseVector.y = -(event.clientY / $(window).height()) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    var intersects = this.raycaster.intersectObjects(this.scene.children);
    if (intersects.length > 0) {
      const check = intersects[0].object
      if (check.info) {
        const { x, y, color } = check.info
        if (this.gameStart && this.isYourMove) {
          if (color === this.color) {
            this.focusedCheck = { x, y }
            this.checkersObjects.forEach(item => {
              if (item.info.color === "move") {
                item.material.opacity = 0
                item.info.color = ""
              }
              if (this.color === "white") {
                if ((item.info.x === x + 1 && item.info.y === y - 1 && !item.info.color) ||
                  (item.info.x === x - 1 && item.info.y === y - 1 && !item.info.color)) {
                  item.material.map = new THREE.TextureLoader().load("mats/" + this.color + "check.jpg")
                  item.material.opacity = 0.5
                  item.info.color = "move"
                } else if ((item.info.x === x + 1 && item.info.y === y - 1 && item.info.color === "black") ||
                  (item.info.x === x - 1 && item.info.y === y - 1 && item.info.color === "black")) {
                  item.info.color = "canMove"
                }
              } else {
                if ((item.info.x === x - 1 && item.info.y === y + 1 && !item.info.color) ||
                  (item.info.x === x + 1 && item.info.y === y + 1 && !item.info.color)) {
                  item.material.map = new THREE.TextureLoader().load("mats/" + this.color + "check.jpg")
                  item.material.opacity = 0.5
                  item.info.color = "move"
                } else if ((item.info.x === x - 1 && item.info.y === y + 1 && item.info.color === "white") ||
                  (item.info.x === x + 1 && item.info.y === y + 1 && item.info.color === "white")) {
                  item.info.color = "canMove"
                }
              }
            })
          } else if (color === "move" || color === "canMove") {
            this.ruch({ x, y })
          }
        }
      }
    }
  }

  ruch = ({ x, y }, color = this.color) => {
    this.isYourMove = false,
      $('h2').text("Ruch " + this.secondPlayer)
    this.checkers[this.focusedCheck.y][this.focusedCheck.x] = 0
    this.checkers[y][x] = this.color === "white" ? 2 : 1
    this.checkersObjects.forEach(item => {
      if (item.info.color === "move") {
        item.info.color = ""
        item.material.opacity = 0
      }
      if (item.info.x === this.focusedCheck.x && item.info.y === this.focusedCheck.y) {
        item.info.color = ""
        item.material.opacity = 0
      }
      if (item.info.x === x && item.info.y === y) {
        item.material.map = new THREE.TextureLoader().load("mats/" + color + "check.jpg")
        item.material.opacity = 1
        item.info.color = color
      }
    })
    console.log(this.checkers)
    this.net.sendMove({ from: this.focusedCheck, to: { x, y } }, color)
    this.checkWin()
  }

  render() {
    requestAnimationFrame(this.render.bind(this)); // funkcja bind(this) przekazuje obiekt this do metody render
    this.renderer.render(this.scene, this.camera);
  }
}