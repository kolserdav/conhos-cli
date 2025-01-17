require 'webrick'

port = ENV['PORT'] || 3000

server = WEBrick::HTTPServer.new(:Port => port)

server.mount_proc '/' do |req, res|
  res.body = 'Hello, Ruby!'
end

trap('INT') { server.shutdown }
server.start