const path = require('path');

module.exports = {
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