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
		
		const { socketInstance } = require('../server.js');

		return new Promise((resolve, reject) => {
			// emit build message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'Building a Node.js image...'
			});

			console.log('Building a Node.js image... ');
			const build = exec('time docker build -t img_node .', { shell: '/bin/bash' }, (error, stdout, stderr) => {
				if (error) {
					console.error(`Error during Node.js image build: ${error}`);
					
					socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
						stdout: 'An error occurred while building the Node.js image.'
					});
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
				
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
					stdout: `A Node.js image has been built.\nTime taken for image build: ${this._totalTime}`
				});
				// if an stderr has occurred and this._stderr has been initialized, ...
				// ... the resolved object should contain the stderr as well
				this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
					: resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
			});
			
			build.stdout.on('data', stdout => {
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
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
		
		const { socketInstance } = require('../server.js');
		
		return new Promise((resolve, reject) => {
			console.log(`Removing any prexisting Node.js container: ${session.socketId}... `);
			// remove any preexisting container
			exec(`docker container rm ${session.socketId} --force`, (error, stdout, stderr) => {
				// emit create message to the connected socket ID
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
					stdout: 'Creating a Node.js container...'
				});
				
				console.log('Creating a Node.js container... ');
				const container = exec(`time docker container create -it --name ${session.socketId} img_node`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
					if (error) {
						console.error(`Error during Node.js container creation: ${error}`);
						
						socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
							stdout: 'An error occurred while creating the Node.js container.'
						});
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
					
					socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
						stdout: `A Node.js container has been created.\nTime taken for container creation: ${this._totalTime}`
					});
					// if an stderr has occurred and this._stderr has been initialized, ...
					// ... the resolved object should contain the stderr as well
					this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) })
						: resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
				});
				
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
		
		const { socketInstance } = require('../server.js');
		
		let containerId = session.socketId;
		
		return new Promise((resolve, reject) => {
			// emit start message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'Starting the Node.js container...'
			});
			console.log('Starting the Node.js container... ');
			exec(`time docker container start ${containerId}`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
				if (error) {
					/*
					 *  A potential err may include 'No such container: ${containerId}' ...
					 *  ... which indicates that the container has not been created yet.
					 *  If so, the client should be sent back a response body ...
					 *  ... that contains a message to use dockerConfig value 0 ...
					 *  ... so as to create a container before starting it.
					*/
					socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
						stdout: 'An error occurred while starting the Node.js container.'
					});
					
					let errorString = `No such container: ${session.socketId}`;
					if (error.message.includes(errorString)) {
						return reject({
							errorType: 'container-not-created-beforehand',
							error,
						});
					}
					console.error(`Error during Node.js container start: ${error.message}`);
					return reject(error.message);
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
				
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
					stdout: `The Node.js container has been started.\nTime taken for container start: ${this._totalTime}`
				});
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
		
		const { socketInstance } = require('../server.js');
		
		// use performance.now() for timing synchronous methods
		let startTime = performance.now();
		let stepTime = 0.0;
		// --- Copy the code inside the container to execute --- 
		let containerId = session.socketId;
		try {
			// emit exec message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'Preparing to execute JavaScript code inside the container...'
			});
			
			stepTime = performance.now();
			// copy submission.js from host to container's home/submission.js
			const container = spawnSync('docker',
				['cp', `client-files/submissions/${session.socketId}.js`, containerId + ':/home/submission.js'], {
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
				/*
				 *  A potential err may include: ...
				 *  ... 'No such container:path: ${containerId}':/home' ...
				 *  ... which indicates that the container has not been created ...
				 *  ... and/or started yet.
				 *  If so, the client should be sent back a response body ...
				 *  ... that contains a message to use dockerConfig value 0 or 1 ...
				 *  ... so as to create a container or start the container (if it exists) ...
				 *  ... before copying files into it.
				*/
				
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
					stdout: 'An error occurred while preparing to execute code inside the Node.js container.'
				});
				
				const errorString = `No such container:path: ${session.socketId}:/home`;
				if (io[2].includes(errorString)) {
					return {
						errorType: 'container-not-started-beforehand',
						error: io[2],
					};
				}
				console.error(`Error during the execution of 'docker cp' command.`);
				console.error(`Error during copying submission.js into the container: ${io[2]}`);
				return { error: io[2] };    
			}
		} catch (err) {
			console.error(`Error during copying submission.js into the container: ${err}`);
			
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'An error occurred while executing code inside the Node.js container.'
			});
			
			return { error: err };
		}
		
		try {
			// emit exec message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'Executing JavaScript code inside the container...'
			});
			
			stepTime = performance.now();
			const child = spawnSync('docker',
				['exec', '-it', containerId, 'node', 'home/submission.js', '|', 'tee', `client-files/outputs/${session.socketId}.txt`], {
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
			
			if (io.stderr !== '') {
				// stderr has piped the error
				socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
					stdout: 'An error occurred while executing code inside the Node.js container.'
				});
				
				const errorString = 'is not running';
				if (io.stderr.includes(errorString)) {
					return {
						errorType: 'container-not-started-beforehand',
						error: io.stderr,
					};
				}                
				return { error: io.stderr };
			}
			console.log('Time taken to execute the code: ' + (now - stepTime) + 'ms');
			
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: `Time taken to execute the code: ${now - stepTime}`
			});
			
			console.log('Total time taken for all execution steps (Fetch ID, Copy, and Exec): ' + (now - startTime) + 'ms');
			console.log("\nSTDIO for 'docker exec' command: ");
			console.dir(io);
			
			return { execTime: now - stepTime };
		} catch (err) {
			console.error(`Error during JavaScript code execution: ${err.stack}`);
			
			socketInstance.instance.to(session.socketId).emit('docker-app-stdout', {
				stdout: 'An error occurred while executing code inside the Node.js container.'
			});
			
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
