const { spawnSync } = require('child_process');
const { performance } = require('perf_hooks');

execInNodeContainer = () => {
    try {
        let startTime = performance.now();
        const nodeExec = spawnSync('docker',
            ['run', '-it', '--rm', '-v', __dirname + '/../file:/usr/src/app', '-w', '/usr/src/app', 'node', 'submission.js'],
            {
                stdio: ['inherit', 'pipe', 'pipe'],
        });
        console.log(`\nTime taken for compiling and executing JavaScript code: ${performance.now() - startTime}ms\n`);
        const io = nodeExec.output.toString().split(',');
        /*
         * io = [0, 1, 2]
         * io = [stdin, stdout, stderr]
         * We need to catch any potential stderr
        */
        console.log("\nSTDIO [stdin, stdout, stderr] for 'docker run' command: ");
        console.dir(io);

        if (io[2] !== '') {
            console.error(`Error during the execution of 'docker run' command: ${io[2]}`);
            return { stderr: io[2] };    
        }
        return { stdout: io[1] }
    } catch (err) {
        console.error(`Error during copying submission.js into the container: ${err}`);
        return { stderr: err };
    }
}

module.exports = { execInNodeContainer };
