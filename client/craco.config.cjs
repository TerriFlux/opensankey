// Inject build-time metadata into the React bundle so the topbar info popover
// can show the current version and the date the build was produced. Must be
// set BEFORE react-scripts/craco reads env, hence at module top-level.
process.env.REACT_APP_VERSION = require('./package.json').version
process.env.REACT_APP_RELEASE_DATE = new Date().toISOString().slice(0, 10)

module.exports = {
    devServer: {
        allowedHosts: ['localhost', '.localhost'], // Make sure these aren't empty
        // or use 'all' for development
        allowedHosts: 'all'
    },
    babel: {
        plugins: [
            [
                '@babel/plugin-transform-typescript', {
                    allowDeclareFields: true,
                },
            ],
            '@babel/plugin-syntax-dynamic-import',
        ],
    },
    webpack: {
        configure: {
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        resolve: {
                            fullySpecified: false,
                        },
                    },
                    {
                        test: /\.tsx?$/,
                        use: 'ts-loader',
                        exclude: /node_modules/,
                    },
                ],
            },
        },
    },
};