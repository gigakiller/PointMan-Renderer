from tornado import websocket, web, ioloop
from json import loads, dumps

class EchoWebSocket(websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened"

    def on_message(self, message):
        msg = loads(message)
        print "request", msg
        self.write_message( dumps(msg) )
        #self.write_message(u"You said: " + message)

    def on_close(self):
        print "WebSocket closed"

app = web.Application( [
  (r'/websocket', EchoWebSocket),
])

if __name__ == '__main__':
  app.listen('8888')
  ioloop.IOLoop.instance().start()
