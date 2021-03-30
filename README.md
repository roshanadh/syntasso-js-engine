# Syntasso
## JavaScript Execution Engine ![](https://travis-ci.com/roshanadh/syntasso-js-engine.svg?token=jtwD19xWMoUy4u3AdP9Q&branch=master)

## Usage
* Clone the repo and change your working directory
    ```sh
    git clone https://github.com/roshanadh/syntasso-js-engine.git && cd syntasso-js-engine
    ```
* Install dependencies
    ```sh
    npm install
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

## Build with Docker
After cloning the repo and populating the '.env' file, you can start the engine using Docker.
* Build the image from the Dockerfile inside the project repo
    ```sh
    docker build -t img_js_engine .
    ```
* Create and run the container in detached mode using the built image
    ```sh
    docker run --privileged --name cont_js_engine -d \
    -e DOCKER_TLS_CERTDIR=/certs \
    -v cont_js_engine_certs_ca:/certs/ca \
    -v cont_js_engine_certs_client:/certs/client \
    -p 8080:8080 img_js_engine
    ```
* Start redis-server as a daemon and run the engine server
    ```sh
    docker exec -it cont_js_engine sh -c "redis-server --daemonize yes && node server.js"
    ```
* Make requests from the [client](https://github.com/roshanadh/syntasso-js-client.git)

***Check [Syntasso JS Engine Wiki](https://github.com/roshanadh/syntasso-js-engine/wiki) for Engine API references***
