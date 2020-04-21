class Net {
  constructor(game) {
    this.id = null
    this.game = game
    this.interval
    this.init()
  }

  sendMove = (moveObject, color) => {
    $.ajax({
      type: 'POST',
      url: '/api',
      data: {
        action: "CHECK_" + (color === "white" ? "WHITE" : "BLACK") + "_MOVE",
        move: JSON.stringify(moveObject)
      },
      success: data => {
        if (data === "reload") {
          clearInterval(this.interval)
          location.reload()
        }
        if (data.success) this.listenEnemyMove()
      }
    });
  }

  listenEnemyMove = () => {
    this.interval = setInterval(() => {
      $.ajax({
        type: 'POST',
        url: '/api',
        data: {
          action: "CHECK_IS_MY_MOVE",
          id: this.id,
        },
        success: data => {
          if (data === "reload") {
            clearInterval(this.interval)
            location.reload()
          }
          if (data.myMove) {
            clearInterval(this.interval)
            this.game.swapMove(data.lastMove)
          }
        }
      }, 500)
    });
  }

  checkAreUsers = () => {
    const { id } = this
    $.ajax({
      type: 'POST',
      url: '/api',
      data: {
        action: "CHECK_SECOND_PLAYER",
        id,
      },
      success: data => {
        if (data === "reload") {
          clearInterval(this.interval)
          location.reload()
        }
        if (data.player2) {
          clearInterval(this.interval)
          this.game.secondPlayerJoined(data.player2.name)
        }
      }
    });
  }

  init() {
    this.id = Math.random() * 100000000000000000
    const { id } = this

    $('.button button').on('click', e => {
      $.ajax({
        type: 'POST',
        url: '/api',
        data: {
          action: "RESET_SERVER",
        },
        success: () => {
          clearInterval(this.interval)
          location.reload()
        }
      });
    })

    $('.login__button').on('click', e => {
      $.ajax({
        type: 'POST',
        url: '/api',
        data: {
          action: "NEW_USER",
          name: $('.login__input input').val(),
          id
        },
        success: data => {
          if (data.observate) {
            $('.login').remove()
            this.game.setCheckers(data.checkers)
          } else if (data.isSameName) {
            $('.login__message').text("Ten nick jest zajęty")
          } else if (!data.player2.connected) {
            $('.login').remove()
            // Interval z sprwadzeniem 2giego grascza
            this.interval = setInterval(this.checkAreUsers, 500)
            this.game.setCheckers(data.checkers, data.player.color, data.player.move, true)
          } else if (data.player2.connected) {
            $('.login').remove()
            this.game.setCheckers(data.checkers, data.player.color, data.player.move, false, data.player2.name)
          }
        }
      });
    })

    $(window).on('unload', function () {
      $.ajax({
        type: 'POST',
        url: '/api',
        data: {
          action: "LEAVE_USER",
          id,
        }
      });
    });
  }
}
