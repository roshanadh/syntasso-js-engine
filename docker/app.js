const { exec, spawnSync } = require('child_process');
const { performance } = require('perf_hooks');

modifyTime = (time) => {
    /*
     * execTime is of type 'number' : It represents miliseconds
     * Other performance times (imageBuildTime, containerCreateTime, and containerStartTime) ...
     * ... are in the form '0m0.000s
     * We need to return these times in a similar structure as execTime
    */
    let minutes = parseInt(time.split('m')[0]);
    // remove trailing 's'
    let seconds = parseFloat((time.split('m')[1]).replace('s', ''));
    // return the time interms of milliseconds
    return ((minutes * 60) + seconds) * 1000;
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
                    this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
                        : resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
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
                this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
                    : resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
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
                ['exec', '-it', 'cont_node', 'node', 'home/submission.js', '|', 'tee', 'file/output.txt'], {
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
}

module.exports = DockerApp;