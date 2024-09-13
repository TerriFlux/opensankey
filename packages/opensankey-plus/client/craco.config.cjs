module.exports = {
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
};