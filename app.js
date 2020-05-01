const { exec } = require('child_process');
console.log('creating an image ...');
exec('docker build -t img_node .', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    console.log('creating a docker container ...');
    setTimeout(createContainer, 5000);
});

createContainer = () => {
    exec('docker container create -it --name cont_node img_node', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('created a container');
        console.log('starting a docker container ...');
        setTimeout(startContainer, 5000);
    });
}

startContainer = () => {
    exec('docker container start cont_node', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log('started a container');
        console.log('attaching a docker container ...');
        setTimeout(attachContainer, 5000);
    });
}

attachContainer = () => {
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

            // setTimeout(attachContainer, 5000);
        });
    });
}