import { generateScssTypingsAndBroadcastChange } from './lib/watchScssChanges';
import { staticServer } from './lib/staticServer';
import config from './../config.json';
import fs from 'fs';
import mime from 'mime';
import path from 'path';
import url from 'url';
import WebpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';

type Listener = (...args: any[]) => void;
import merge_export from './../webpack.config';
const port = config.PORT;
const compExport: webpack.Configuration = merge_export('hotreload');
const finalExport = webpack(compExport);
const webpackConfig = require('./../webpack.config');
const devServerOptions = webpackConfig.devServer;

const httpServer = new WebpackDevServer(finalExport, {
	publicPath: '/',
	hot: true,
	historyApiFallback: true,
	clientLogLevel: 'warning',
	compress: true,
	quiet: false,
	noInfo: false,
	stats: {
		assets: false,
		children: false,
		chunks: false,
		chunkModules: false,
		colors: true,
		entrypoints: false,
		hash: false,
		modules: false,
		timings: false,
		version: false,
	}
}).listen(port, '0.0.0.0', () => {
	if (Error) {
		console.log(Error);
	}

	console.log('Listening at http://127.0.0.1:' + port);
	
});

// Serve static files from public
const listeners = httpServer.listeners('request');

listeners.forEach((listener) => {
	httpServer.removeListener('request', listener as Listener);

	httpServer.on('request', (req: { url: string; }, res: { setHeader: (arg0: string, arg1: string | null) => void; end: (arg0: Buffer) => void; }) => {
		const pathname = url.parse(req.url).pathname;
		const filePath = path.resolve(`${__dirname}/../dist/${pathname}`);

		fs.readFile(filePath, (err, data) => {
			// If we can't find file in /dist/ fallback to webpack
			if (err) {
				return listener(req, res);
			}

			res.setHeader('Content-type', mime.getType(filePath));
			res.end(data);
		});
	});
});
staticServer(httpServer);
generateScssTypingsAndBroadcastChange(port)
