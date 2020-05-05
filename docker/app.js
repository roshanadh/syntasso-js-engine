const { exec, spawnSync } = require('child_process');

class DockerApp {
    buildNodeImage = () => {
        return new Promise((resolve, reject) => {
            console.log('Building a Node.js image ... ');
            exec('docker build -t img_node .', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during Node.js image build: ${error}`);
                    reject(error);
                }
                if (stderr) {
                    console.error(`stderr during Node.js image build: ${stderr}`);
                    resolve({ success: true, stderr });
                }
                stdout ? console.error(`stdout during Node.js image build: ${stdout}`)
                    : console.log('Node.js image built.');
                resolve({ success: true, stdout });
                // console.log('creating a docker container ...');
                // setTimeout(createContainer, 100);
            });
        });
    }
    
    createNodeContainer = () => {
        return new Promise((resolve, reject) => {
            console.log('Removing any prexisting Node.js container ... ');
            // remove any preexisting container
            exec('docker container rm cont_node --force', (error, stdout, stderr) => {
                console.log('Creating a Node.js container ... ');
                exec('docker container create -it --name cont_node img_node', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error during Node.js container creation: ${error}`);
                        reject(error);
                    }
                    if (stderr) {
                        console.error(`stderr during Node.js container creation: ${stderr}`);
                        resolve({ success: true, stderr });
                    }
                    stdout ? console.error(`stdout during Node.js container creation: ${stdout}`)
                        : console.log('Node.js container created.');
                    resolve({ success: true, stdout });
                    // console.log('starting a docker container ...');
                    // setTimeout(startContainer, 100);
                });
            });	
        });
    }
    
    startNodeContainer = () => {
        return new Promise((resolve, reject) => {
            console.log('Starting the Node.js container ... ');
            exec('docker container start cont_node', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during Node.js container start: ${error}`);
                    reject(error);
                }
                if (stderr) {
                    console.error(`stderr during Node.js container start: ${stderr}`);
                    resolve({ success: true, stderr });
                }
                stdout ? console.error(`stdout during Node.js container start: ${stdout}`)
                    : console.log('Node.js container started.');
                resolve({ success: true, stdout });
                // console.log('executing ...');
                // setTimeout(execInContainer, 100);
            });
        });
    }
    
    execInNodeContainer = () => {
        try{
            const child = spawnSync('docker',
                ['exec', '-it', 'cont_node', 'node', 'home/submission.js', '|', 'tee', 'file/.output'], {
                    shell: true,
                    stdio: ['inherit', 'pipe', 'pipe'],
            });
            
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
            console.table(io);
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