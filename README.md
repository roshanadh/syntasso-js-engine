# Syntasso
## JavaScript Execution Engine ![](https://travis-ci.com/roshanadh/syntasso-js-engine.svg?token=jtwD19xWMoUy4u3AdP9Q&branch=test)

## Usage
* Clone the repo and change your working directory
    ```sh
    git clone https://github.com/roshanadh/syntasso-js-engine.git && cd syntasso-js-engine
    ```
* Install dependencies
    ```sh
    npm install
    ```
* Create a 'client-files' directory at the root of the project
    ```sh
    mkdir client-files && cd client-files && mkdir submissions outputs
    ```
* Create a '.env' file at the root of the project and append environment variables and their values to the file
    ```sh
    touch .env
    ```
* Run the server
    ```sh
    node server.js
    ```
* Make requests from the [client](https://github.com/roshanadh/syntasso-js-client.git)

## Environment Variables
Environment variables for the project include:

* PORT: For the engine server to listen on.

* LIVE_SERVER_PORT: For the engine server to accept cross origin requests from (CORS requirement).

* SECRET_DIVIDER_TOKEN: For separating the user-submitted code's output and Node.js runtime-generated error object appended to the output file.

* SECRET_SESSION_KEY: For encrypting the session.

## Endpoints
The API exposes three endpoints and the following actions:

1. Simple 'Hello World!' route
    ```
    GET /
    ```
 
2. Route to POST a code snippet
    ```
    POST /execute
    ```
    The request body must include three parameters:
    
    i. *socketId* [String]: For verifying socket connection with the client.

    ii. *code* [String]: The code snippet to be executed by the engine. 

    iii. *dockerConfig* [Integer { 0 | 1 | 2 }, but passed as a String]: Indicates whether a Node.js docker container needs to be created from scratch, or can be just started before execution, or that a pre-existing container can be used.
    
3. Route to POST a JavaScript file
    ```
    POST /upload
    ```
    The request body must include three parameters:
    
    i. *socketId* [String]: For verifying socket connection with the client.

    ii. *submission* [A .js file]: The JavaScript file to be executed. 

    iii. *dockerConfig* [Integer { 0 | 1 | 2 }, but passed as a String]: Indicates whether a Node.js docker container needs to be created from scratch, or can be just started before execution, or that a pre-existing container can be used.
       




