const path = require('path');

module.exports = {
    babel: {
        // presets: [
        //     ["react-app", { "absoluteRuntime": false }]
        // ],
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
                        }
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
    // resolve: {
    //     alias: {
    //         'react': path.resolve('./node_modules/react'),
    //         'react-dom': path.resolve('./node_modules/react-dom'),
    //     }
    // }
};