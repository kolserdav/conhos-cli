import os
from flask import Flask

PORT = int(os.environ['PORT'])



app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, Python!'

if __name__ == '__main__':
    app.run('0.0.0.0', PORT)