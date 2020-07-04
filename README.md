# Syntasso
## JavaScript Execution Engine ![](https://travis-ci.com/roshanadh/syntasso-js-engine.svg?token=jtwD19xWMoUy4u3AdP9Q&branch=upload-js-file)

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

## Environment Variables
Environment variables for the project include:

* PORT: For the engine server to listen on.

* LIVE_SERVER_PORT: For the engine server to accept cross origin requests from (CORS requirement).

* SECRET_DIVIDER_TOKEN: For separating the user-submitted code's output and Node.js runtime-generated error object appended to the output file.

* SECRET_SESSION_KEY: For encrypting the session.

## Endpoints
The API exposes four endpoints and the following actions:

1. Simple 'Hello World!' route
    ```
    GET /
    ```
 
2. Route to POST a code snippet
    ```
    POST /execute
    ```
    The request body ***must*** include three parameters (via JSON or x-www-form-urlencoded):
    
    i. *socketId* [String]: For verifying socket connection with the client.

    ii. *code* [String]: The code snippet to be executed by the engine. 

    iii. *dockerConfig* [Integer { 0 | 1 | 2 }, but passed as a String]: Indicates whether a Node.js docker container needs to be created from scratch, or can be just started before execution, or that a pre-existing container can be used.

    The request body ***may*** also include the following fields (if these are included, send the request via form-data, including the three parameters mentioned above):
    
    i. *sampleInputs* [.txt file] [maxCount: 8]: For supplying the client-submitted code with input data.

    ii. *expectedOutputs* [.txt file] [maxCount: 8]: For assertion testing against the outputs observed after passing sample inputs.
    
3. Route to POST a JavaScript file
    ```
    POST /upload
    ```
    The request body ***must*** include three parameters:
    
    i. *socketId* [String]: For verifying socket connection with the client.

    ii. *submission* [.js file] [maxCount: 1]: The JavaScript file to be executed. 

    iii. *dockerConfig* [Integer { 0 | 1 | 2 }, but passed as a String]: Indicates whether a Node.js docker container needs to be created from scratch, or can be just started before execution, or that a pre-existing container can be used.
       
    The request body ***may*** also include the following fields (if these are included, send the request via form-data, including the three parameters mentioned above):
    
    i. *sampleInputs* [.txt file] [maxCount: 8]: For supplying the client-submitted program with input data.

    ii. *expectedOutputs* [.txt file] [maxCount: 8]: For assertion testing against the outputs observed after passing sample inputs.
    
4. Route to POST a code snippet and test cases
    ```
    POST /submit
    ```
    The request body ***must*** include four parameters:
    
    i. *socketId* [String]: For verifying socket connection with the client.

    ii. *code* [String]: The code snippet to be executed by the engine. 

    iii. *dockerConfig* [Integer { 0 | 1 | 2 }, but passed as a String]: Indicates whether a Node.js docker container needs to be created from scratch, or can be just started before execution, or that a pre-existing container can be used.
        
    iv. *testCases* [Array]: An array of JSON objects. The engine will parse each element (each element being a JSON object) and generate files needed to run main-wrapper.js.
    	Structure of testCases:
	[
		{
			sampleInput: "",
			expectedOutput: "",
		}, {}, {}, ...
	]

## dockerConfig
There are three possible values to dockerConfig: 0, 1, and 2.
* 0:
    * Using the Dockerfile at the root of the project, the engine will build an image tagged img_node.
    * After the image is built, the engine will create a container using *img_node*.
    * The engine will start the container.
    * The engine will start a bash environment inside the container using '*docker exec*' so as to execute the submitted code/file.
  
* 1:
    * The engine assumes that a container has already been created using *img_node* and so the engine attempts to start the container, i.e., if the container exists, otherwise the engine responds with an error.
    * The engine will start a bash environment inside the container using '*docker exec*' so as to execute the submitted code/file.

* 2:
    * The engine assumes that a container has already been created using *img_node* and that the container has already been started.
    * The engine attempts to start a bash environment inside the container using '*docker exec*', i.e., if the container exists and has already been started, otherwise the engine responds with an error.

## Events
1. docker-app-stdout:
    
    - Emitted by the engine to log steps performed for each request.
    - Logs stdout for image build, and other logs for container creation, container start, copy, and exec operations.
    - Structure:
    ```json
        docker-app-stdout = {
            stdout: [string],
        }
    ```
2. test-status:
   
   - Emitted by the engine to notify the client of each test case performed for the submitted code/file.
   - n test-status events are emitted for n sample input files uploaded by the client.
   - Structure:
    ```json
        test-status = {
        	type: "test-status",
		process: [Integer],
		testStatus: [Boolean],
        }
    ```
