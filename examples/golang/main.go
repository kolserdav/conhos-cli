package main

import (
	"os"
	"fmt"
	"net/http"
)


func helloWorld(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, Golang!")
}

func main() {
	http.HandleFunc("/", helloWorld)
	port := os.Getenv("PORT")
	fmt.Println("Server started at localhost:", port)
	http.ListenAndServe(":" + port, nil)
}