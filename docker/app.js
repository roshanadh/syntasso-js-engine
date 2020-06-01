const { exec, spawnSync } = require('child_process');
const { performance } = require('perf_hooks');

modifyTime = (time) => {
    /*
     * execTime is of type 'number' : It represents miliseconds
     * Other performance times (imageBuildTime, containerCreateTime, and containerStartTime) ...
     * ... are in the form '0m0.000s
     * We need to return these times in a similar structure as execTime
    */
    try {
        let minutes = parseInt(time.split('m')[0]);
        // remove trailing 's'
        let seconds = parseFloat((time.split('m')[1]).replace('s', ''));
        // return the time interms of milliseconds
        return ((minutes * 60) + seconds) * 1000;
    } catch (err) {
        return err;
    }
}

class DockerApp {
    buildNodeImage = (session) => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;
        
        return new Promise((resolve, reject) => {
            console.log('Building a Node.js image ... ');
            const build = exec('time docker build -t img_node .', { shell: '/bin/bash' }, (error, stdout, stderr) => {
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
                this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
                    : resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
            });

            const { socketInstance } = require('../server.js');
            build.stdout.on('data', stdout => {
                socketInstance.instance.to(session.socketId).emit('build-img-stdout', {
                    stdout
                });
            });
        });
    }
    
    createNodeContainer = (session) => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;
        
        return new Promise((resolve, reject) => {
            console.log(`Removing any prexisting Node.js container ${session.socketId}... `);
            // remove any preexisting container
            exec(`docker container rm ${session.socketId} --force`, (error, stdout, stderr) => {
                console.log('Creating a Node.js container ... ');
                const container = exec(`time docker container create -it --name ${session.socketId} img_node`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
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
                    this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
                        : resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
                });

                // 
                container.stdout.on('data', containerId => {
                    socketInstance.instance.to(session.socketId).emit('container-id', { containerId });
                });
            });	
        });
    }
    
    startNodeContainer = (session) => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;

        let containerId = session.socketId;

        return new Promise((resolve, reject) => {
            console.log('Starting the Node.js container ... ');
            exec(`time docker container start ${containerId}`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
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
                this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
                    : resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
            });
        });
    }
    
    execInNodeContainer = (session) => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;

        // use performance.now() for timing synchronous methods
        let startTime = performance.now();
        let stepTime = 0.0;
        // --- Copy the code inside the container to execute --- 
        let containerId = session.socketId;
        try {
            stepTime = performance.now();
            // copy submission.js from host to container's home/submission.js
            const container = spawnSync('docker',
                ['cp', 'file/submission.js', containerId + ':/home/submission.js'], {
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
                ['exec', '-it', containerId, 'node', 'home/submission.js', '|', 'tee', 'file/output.txt'], {
                    shell: true,
                    stdio: ['inherit', 'pipe', 'pipe'],
            });
            let now = parseFloat(performance.now());

            const ioArray = child.output;
            // ioArray = [0, 1, 2]
            // ioArray = [stdin, stdout: Buffer, stderr: Buffer]

            const io = {
                stdin: ioArray[0],
                stdout: ioArray[1].toString('utf-8'),
                stderr: ioArray[2].toString('utf-8')
            };

            if (!(io.stderr === '')) {
                // stderr has piped the error
                return { error: io.stderr };
            }
            console.log('Time taken to execute the code: ' + (now - stepTime) + 'ms');
            console.log('Total time taken for all execution steps (Fetch ID, Copy, and Exec): ' + (now - startTime) + 'ms');

            console.log("\nSTDIO for 'docker exec' command: ");
            console.dir(io);

            return { execTime: now - stepTime };
        } catch (err) {
            console.error(`Error during JavaScript code execution: ${err}`);
            return { error: err };
        }
    }

    removeNodeContainer = (socketId) => {
        // set all instance variables null so that it does not retain value from any previous ...
        // ... method call
        this._stderr = null;
        this._times = null;
        this._totalTime = null;

        // use performance.now() for timing synchronous methods
        let stepTime = 0.0;
        try {
            stepTime = performance.now();
            // copy submission.js from host to container's home/submission.js
            const container = spawnSync('docker',
                ['container', 'rm', socketId, '--force'], {
                    stdio: ['pipe', 'pipe', 'pipe'],
            });
            console.log('Time taken for removeNodecontainer() call: ' + (performance.now() - stepTime) + 'ms');

            const io = container.output.toString().split(',');
            /*
             * io = [0, 1, 2]
             * io = [stdin, stdout, stderr]
             * We need to catch any potential stderr
             * 
             * Also, any potential stderr may be: ...
             * ... 'Error: No such container: ${containerId}'
             * In such cases, the connected client may not have created a container ...
             * ... so there's no problem if a non-existent container couldn't be removed.
             * 
             * And so we don't need to log such an error.
             * 
             * We need to parse io[2] (i.e. the stderr) to see if it is the very same error ...
             * ... as mentioned above.
            */
            if (io[2] !== '') {
                const errorArr = io[2].split(':');
                if (errorArr[1].trim() !== 'No such container') {
                    console.error(`Error during the execution of 'docker container rm' command.`);
                    console.error(`Error during removing the container: ${io[2]}`);
                } else {
                    console.log('No container was removed.')
                }
                return { error: io[2] };    
            }
            console.error(`Container named ${socketId} has been removed after the client's socket disconnection.`);
        } catch (err) {
            console.error(`Error in dockerApp.removeNodeContainer(): ${err}`);
            return { error: err };
        }
    }
}

module.exports = DockerApp;
