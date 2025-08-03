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