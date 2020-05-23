const DockerApp = require('../docker/app.js');
const { readOutput } = require('../file/index.js');

const dockerApp = new DockerApp();

class DockerConfigHandler {
    handleConfigZero = async(res) => {
        let imageBuildTime, containerCreateTime, containerStartTime;
        try {
            let { stderr, totalTime } = await dockerApp.buildNodeImage();
            imageBuildTime = totalTime;

            stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
            : console.log('Node.js image built.');

        } catch (err) {
            // handle promise rejection
            res.status(503).send(`Service currently unavailable due to server conditions.`);
            throw new Error(`Error in dockerApp.buildNodeImage(): ${error}`);
        }    
        try {
            let { stderr, totalTime } = await dockerApp.createNodeContainer();
            containerCreateTime = totalTime;

            stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
            : console.log('Node.js container created.');

        } catch (err) {
            // handle promise rejection
            res.status(503).send(`Service currently unavailable due to server conditions.`);
            throw new Error(`Error in dockerApp.createNodeContainer(): ${error}`);
        }
        try {
            let { stderr, totalTime } = await dockerApp.startNodeContainer();
            containerStartTime = totalTime;

            stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
            : console.log('Node.js container started.');

        } catch (err) {
            // handle promise rejection
            res.status(503).send(`Service currently unavailable due to server conditions.`);
            throw new Error(`Error in dockerApp.startNodeContainer(): ${error}`);
        }

        let { error, execTime } = dockerApp.execInNodeContainer();
        if (error) {
            console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
            res.status(503).send(`Service currently unavailable due to server conditions.`);   
        }
        console.log('\nResponse to the client:');
        const response = {
            output: readOutput().toString(),
            imageBuildTime,
            containerCreateTime,
            containerStartTime,
            execTime,
        };
        console.dir(response);
        res.status(200).json(response);
    }

    handleConfigOne = async(res) => {
        let containerStartTime;
        try {
            let { stderr, totalTime } = await dockerApp.startNodeContainer();
            containerStartTime = totalTime;

            stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
            : console.log('Node.js container started.');

        } catch (err) {
            // handle promise rejection
            res.status(503).send(`Service currently unavailable due to server conditions.`);
            throw new Error(`Error in dockerApp.startNodeContainer(): ${error}`);
        }

        let { error, execTime } = dockerApp.execInNodeContainer();
        if (error) {
            console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
            res.status(503).send(`Service currently unavailable due to server conditions.`);   
        }
        console.log('\nResponse to the client:');
        const response = {
            output: readOutput().toString(),
            containerStartTime,
            execTime,
        };
        console.dir(response);
        res.status(200).json(response);
    }

    handleConfigTwo = (res) => {
        let { error, execTime } = dockerApp.execInNodeContainer();
        if (error) {
            console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
            /*
             * Check if the error message is for an idle container
            */
            try {
                if (error.slice(-15).trim() === "is not running")
                    res.status(503).json({
                        error: "The container is not currently running on the server. Request again with dockerConfig 0 or 1."
                    });
                else res.status(503).send(`Service currently unavailable due to server conditions.`);
            } catch (err) {
                console.error(`Error during slicing the error message from dockerApp.execInNodeContainer(): ${err}`);
                res.status(503).send(`Service currently unavailable due to server conditions.`);
            }
        } else {
            console.log('\nResponse to the client:');
            const response = {
                output: readOutput().toString(),
                execTime,
            };
            console.dir(response);
            res.status(200).json(response);    
        }
    }    
}

module.exports = DockerConfigHandler;
