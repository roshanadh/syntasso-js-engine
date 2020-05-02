const { exec, spawnSync } = require('child_process');

console.log('creating an image ...');
exec('docker build -t img_node .', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    console.log('creating a docker container ...');
    setTimeout(createContainer, 100);
});

createContainer = () => {
	exec('docker container rm cont_node --force', (error, stdout, stderr) => {
		exec('docker container create -it --name cont_node img_node', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('created a container');
        console.log('starting a docker container ...');
        setTimeout(startContainer, 100);
    });
	});	
}

startContainer = () => {
    exec('docker container start cont_node', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('started a container');
        console.log('executing ...');
        setTimeout(execInContainer, 100);
    });
}

execInContainer = () => {
	const child = spawnSync('docker',
			['exec', '-it', 'cont_node', 'node', 'home/sample.js'], {
				stdio: 'inherit'
		});
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
