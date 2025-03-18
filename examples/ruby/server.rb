require 'webrick'

port = ENV['PORT'] || 3000

server = WEBrick::HTTPServer.new(:Port => port)

server.mount_proc '/' do |req, res|
  client_ip = req.header['x-forwarded-for'] ? req.header['x-forwarded-for'].first : req.remote_ip
  puts "Client IP: #{client_ip}"
  res.body = 'Hello, Ruby!'
end

trap('INT') { server.shutdown }
server.start