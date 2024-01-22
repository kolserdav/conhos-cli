use std::{io::{Write, Result}, net::{TcpListener, TcpStream}, env};

fn handle_client(stream: &mut TcpStream) -> Result<()> {
    stream.write("HTTP/1.1 200 OK\r\nContent-Length: 17\r\n\r\nHello from cloud!".as_bytes())?;
    stream.write(&[0])?;
    Ok(())
}

fn get_port() -> String {
    let mut port = "3000".to_string();
    for (name, value) in env::vars() {
        if name == "PORT" {
            port = value;
        }
    }
    return port;
}

fn main() -> Result<()> {
    let port = get_port();
    let listener = TcpListener::bind(format!("0.0.0.0:{port}"))?;

    println!("Listening at port {port}");

    // accept connections and process them serially
    for stream in listener.incoming() {
        let mut stream = stream?;
        handle_client(&mut stream)?;
    }
    Ok(())
}