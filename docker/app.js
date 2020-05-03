const { exec, spawnSync } = require('child_process');

class dockerApp {
    buildNodeImage = () => {
        console.log('Building a Node.js image ... ');
        exec('docker build -t img_node .', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during Node.js image build: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr during Node.js image build: ${stderr}`);
                return;
            }
            stdout ? console.error(`stdout during Node.js image build: ${stdout}`)
                : console.log('Node.js image built.') ;
            // console.log('creating a docker container ...');
            // setTimeout(createContainer, 100);
        });
    }
    
    createNodeContainer = () => {
        // remove any preexisting container
        exec('docker container rm cont_node --force', (error, stdout, stderr) => {
            exec('docker container create -it --name cont_node img_node', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during Node.js container creation: ${error}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr during Node.js container creation: ${stderr}`);
                    return;
                }
                stdout ? console.error(`stdout during Node.js container creation: ${stdout}`)
                    : console.log('Node.js container created.') ;
                // console.log('starting a docker container ...');
                // setTimeout(startContainer, 100);
            });
        });	
    }
    
    startNodeContainer = () => {
        exec('docker container start cont_node', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error during Node.js container start: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr during Node.js container start: ${stderr}`);
                return;
            }
            stdout ? console.error(`stdout during Node.js container start: ${stdout}`)
                : console.log('Node.js container started.') ;
            // console.log('executing ...');
            // setTimeout(execInContainer, 100);
        });
    }
    
    execInNodeContainer = () => {
        try{
            const child = spawnSync('docker',
                ['exec', '-it', 'cont_node', 'node', 'home/sample.js'], {
                    stdio: 'inherit'
            });
        } catch (err) {
            console.error(`Error during JavaScript code execution: ${err}`);
        }
    }
    
    runContainer = () => {
        // remove container if exists
        exec('docker container rm cont_node', (error, stdout, stderr) => {
            const child = spawnSync('docker',
                ['container', 'run', '-it', '--name', 'cont_node', 'img_node'], {
                    stdio: 'inherit'
            });
        });	
    }
    
    attachContainer = () => {
        const child_process = require('child_process');
        child_process.spawnSync('docker', [ 'run', '--rm', '-ti', 'hello-world' ], {
        stdio: 'inherit'
    });
        const child = spawn('docker', ['container', 'run', 'cont_node']);
    
        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
    
        child.stdout.on('data', (data) => {
            console.log('attached a container');
            console.log(data.toString());
            
        exec('docker container attach cont_node', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log('attached a container');
            exec(`console.log("Hello World!");`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`final stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
    
            });
        });
        });
    }
}

module.exports = dockerApp;