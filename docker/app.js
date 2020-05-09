const { exec, spawnSync } = require('child_process');
const { performance } = require('perf_hooks');

class DockerApp {
    buildNodeImage = () => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;
        
        return new Promise((resolve, reject) => {
            console.log('Building a Node.js image ... ');
            exec('time docker build -t img_node .', { shell: '/bin/bash' }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during Node.js image build: ${error}`);
                    reject(error);
                }
                if (stderr) {
                    /*
                     * 'time' command returns the real(total), user, and sys(system) ...
                     * ... times for the execution of following command (e.g. docker build ... )
                     * The times are returned in the following structure:
                     * ++++++++++++++++++
                     * + real\t0m0.000s +
                     * + user\t0m0.000s +
                     * + sys\t0m0.000s  +
                     * ++++++++++++++++++
                     * Note: 0m0.000s = 0minutes and 0.000 seconds
                     * We need to extract real(total) time from the returned timed.
                     * The times are returned as an 'stderr' object
                    */
                    try {
                        this._times = stderr.split('\n');
                        this._totalTime = this._times[1].split('\t')[1];
                    } catch (err) {
                        // stderr contains an actual error and not execution times
                        console.error(`stderr during Node.js image build: ${stderr}`);
                        this._stderr = stderr;   
                    } 
                }
                stdout ? console.error(`stdout during Node.js image build: ${stdout}`)
                    : console.log('Node.js image built.');
                
                console.log(`Time taken for image build: ${this._totalTime}`);
                // if an stderr has occurred and this._stderr has been initialized, ...
                // ... the resolved object should contain the stderr as well
                this._stderr ? resolve({ success: true, stdout, stderr, totalTime: this._totalTime })
                    : resolve({ success: true, stdout, totalTime: this._totalTime });
            });
        });
    }
    
    createNodeContainer = () => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;
        
        return new Promise((resolve, reject) => {
            console.log('Removing any prexisting Node.js container ... ');
            // remove any preexisting container
            exec('docker container rm cont_node --force', (error, stdout, stderr) => {
                console.log('Creating a Node.js container ... ');
                exec('time docker container create -it --name cont_node img_node', { shell: '/bin/bash' }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error during Node.js container creation: ${error}`);
                        reject(error);
                    }
                    if (stderr) {
                        /*
                         * 'time' command returns the real(total), user, and sys(system) ...
                         * ... times for the execution of following command (e.g. docker build ... )
                         * The times are returned in the following structure:
                         * ++++++++++++++++++
                         * + real\t0m0.000s +
                         * + user\t0m0.000s +
                         * + sys\t0m0.000s  +
                         * ++++++++++++++++++
                         * Note: 0m0.000s = 0minutes and 0.000 seconds
                         * We need to extract real(total) time from the returned timed.
                         * The times are returned as an 'stderr' object
                        */
                        try {
                            this._times = stderr.split('\n');
                            this._totalTime = this._times[1].split('\t')[1];
                        } catch (err) {
                            // stderr contains an actual error and not execution times
                            console.error(`stderr during Node.js container creation: ${stderr}`);
                            this._stderr = stderr;   
                        } 
                    }
                    stdout ? console.error(`stdout during Node.js container creation: ${stdout}`)
                        : console.log('Node.js container created.');

                    console.log(`Time taken for container creation: ${this._totalTime}`);
                    // if an stderr has occurred and this._stderr has been initialized, ...
                    // ... the resolved object should contain the stderr as well
                    this._stderr ? resolve({ success: true, stdout, stderr, totalTime: this._totalTime })
                        : resolve({ success: true, stdout, totalTime: this._totalTime });
                });
            });	
        });
    }
    
    startNodeContainer = () => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;
        
        return new Promise((resolve, reject) => {
            console.log('Starting the Node.js container ... ');
            exec('time docker container start cont_node', { shell: '/bin/bash' }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during Node.js container start: ${error}`);
                    reject(error);
                }
                if (stderr) {
                    /*
                     * 'time' command returns the real(total), user, and sys(system) ...
                     * ... times for the execution of following command (e.g. docker build ... )
                     * The times are returned in the following structure:
                     * ++++++++++++++++++
                     * + real\t0m0.000s +
                     * + user\t0m0.000s +
                     * + sys\t0m0.000s  +
                     * ++++++++++++++++++
                     * Note: 0m0.000s = 0minutes and 0.000 seconds
                     * We need to extract real(total) time from the returned timed.
                     * The times are returned as an 'stderr' object
                    */
                    try {
                        this._times = stderr.split('\n');
                        this._totalTime = this._times[1].split('\t')[1];
                    } catch (err) {
                        // stderr contains an actual error and not execution times
                        console.error(`stderr during Node.js container start: ${stderr}`);
                        this._stderr = stderr;   
                    } 
                }
                stdout ? console.error(`stdout during Node.js container start: ${stdout}`)
                    : console.log('Node.js container started.');

                console.log(`Time taken for container start: ${this._totalTime}`);
                // if an stderr has occurred and this._stderr has been initialized, ...
                // ... the resolved object should contain the stderr as well
                this._stderr ? resolve({ success: true, stdout, stderr, totalTime: this._totalTime })
                    : resolve({ success: true, stdout, totalTime: this._totalTime });
            });
        });
    }
    
    execInNodeContainer = () => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;

        // use performance.now() for timing synchronous methods
        let startTime = performance.now();
        let stepTime = 0.0;
        // --- Copy the code inside the container to execute --- 
        let containerID;
        try {
            // get container ID from container name 'cont_node'
            let container = spawnSync('docker',
                ['ps', '-aqf', "\"name=cont_node\""], {
                    shell: true,
                    stdio: ['pipe', 'pipe', 'pipe'],
            });
            stepTime = performance.now() - startTime;
            containerID = container.output.toString().split(',')[1].trim();
            /*
             * When there are multiple containers with names containing "cont_node" substring, ...
             * ... containerID string contains multiple container IDs separated by a newline
             * We need to extract the first container ID that exactly matches the "cont_node" name
            */
            containerID = containerID.split('\n')[0];
            console.log('Container ID is: ' + containerID);

            console.log('\nTime taken to fetch container ID: ' + stepTime + 'ms');

            stepTime = performance.now();
            // copy submission.js from host to container's home/submission.js
            container = spawnSync('docker',
                ['cp', 'file/submission.js', containerID + ':/home/submission.js'], {
                    stdio: ['pipe', 'pipe', 'pipe'],
            });
            console.log('Time taken to copy submission.js into the container: ' + (performance.now() - stepTime) + 'ms');

            const io = container.output.toString().split(',');
            /*
             * io = [0, 1, 2]
             * io = [stdin, stdout, stderr]
             * We need to catch any potential stderr
            */
            if (io[2] !== '') {
                console.error(`Error during the execution of 'docker cp' command.`);
                console.error(`Error during copying submission.js into the container: ${io[2]}`);
                return { error: io[2] };    
            }
        } catch (err) {
            console.error(`Error during copying submission.js into the container: ${err}`);
            return { error: err };
        }

        try {
            stepTime = performance.now();
            const child = spawnSync('docker',
                ['exec', '-it', 'cont_node', 'node', 'home/submission.js', '|', 'tee', 'file/.output'], {
                    shell: true,
                    stdio: ['inherit', 'pipe', 'pipe'],
            });
            console.log('Time taken to execute the code: ' + (performance.now() - stepTime) + 'ms');
            console.log('Total time taken for all execution steps (Fetch ID, Copy, and Exec): ' + (performance.now() - startTime) + 'ms');

            const ioArray = child.output.toString().split(',');
            // ioArray = [0, 1, 2]
            // ioArray = [stdin, stdout, stderr]

            const io = {
                stdin: ioArray[0],
                stdout: ioArray[1],
                stderr: ioArray[2]
            };

            if (!(io.stderr === '')) {
                // stderr has piped the error
                return { error: io.stderr };
            }
            console.log("\nSTDIO for 'docker exec' command: ");
            console.dir(io);
        } catch (err) {
            console.error(`Error during JavaScript code execution: ${err}`);
            return { error: err };
        }
    }
    
    // runContainer = () => {
    //     // remove container if exists
    //     exec('docker container rm cont_node', (error, stdout, stderr) => {
    //         const child = spawnSync('docker',
    //             ['container', 'run', '-it', '--name', 'cont_node', 'img_node'], {
    //                 stdio: 'inherit'
    //         });
    //     });	
    // }
    
    // attachContainer = () => {
    //     const child_process = require('child_process');
    //     child_process.spawnSync('docker', [ 'run', '--rm', '-ti', 'hello-world' ], {
    //     stdio: 'inherit'
    // });
    //     const child = spawn('docker', ['container', 'run', 'cont_node']);
    
    //     child.stderr.on('data', (data) => {
    //         console.error(`stderr: ${data}`);
    //     });
    
    //     child.stdout.on('data', (data) => {
    //         console.log('attached a container');
    //         console.log(data.toString());
            
    //     exec('docker container attach cont_node', (error, stdout, stderr) => {
    //         if (error) {
    //             console.error(`exec error: ${error}`);
    //             return;
    //         }
    //         console.log('attached a container');
    //         exec(`console.log("Hello World!");`, (error, stdout, stderr) => {
    //             if (error) {
    //                 console.error(`exec error: ${error}`);
    //                 return;
    //             }
    //             console.log(`final stdout: ${stdout}`);
    //             console.error(`stderr: ${stderr}`);
    
    //         });
    //     });
    //     });
    // }
}

module.exports = DockerApp;