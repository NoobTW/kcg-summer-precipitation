const path = require("path");

module.exports = {
	entry: require.resolve("./src/main.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "main.js"
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
					}
				]
			}
		]
	}
};