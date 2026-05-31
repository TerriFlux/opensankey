// Inject build-time metadata into the React bundle so the topbar info popover
// can show the current version, build/commit info and links. Must be set
// BEFORE react-scripts/craco reads env, hence at module top-level.
//
// Release channel is derived from the deploy ENV variable set by the CI jobs
// (dev_/test_/prod_opensankey). The package.json version is left untouched;
// the channel only adds a display suffix:
//   ENV=prod -> stable -> 1.1.X      (production)
//   ENV=test -> beta   -> 1.1.X.b    (test)
//   else      -> alpha  -> 1.1.X.a   (dev / local build)
const { execSync } = require('child_process')
const pkg = require('./package.json')

const ENV = process.env.ENV || ''
const channel = ENV === 'prod' ? 'stable' : ENV === 'test' ? 'beta' : 'alpha'
const suffix = channel === 'beta' ? '.b' : channel === 'alpha' ? '.a' : ''

// Short commit hash + its date, for the info popover. Wrapped in try/catch so a
// build without a usable git checkout (shallow clone, tarball) just shows nothing.
let commit = ''
let commitDate = ''
try {
    commit = execSync('git rev-parse --short HEAD').toString().trim()
    commitDate = execSync('git log -1 --format=%cI').toString().trim().slice(0, 10)
} catch (e) { /* no git metadata available — leave empty */ }

process.env.REACT_APP_VERSION = pkg.version + suffix
process.env.REACT_APP_RELEASE_DATE = new Date().toISOString().slice(0, 10)
process.env.REACT_APP_RELEASE_CHANNEL = channel
process.env.REACT_APP_GIT_COMMIT = commit
process.env.REACT_APP_GIT_COMMIT_DATE = commitDate
// Changelog served by the SA Flask backend itself (route /changelog) — same
// host as the deployed app, always in sync with the deployed commit, and no
// dependency on the private repo. The CHANGELOG already lists every version,
// so a single link covers both "what changed" and "previous versions".
process.env.REACT_APP_CHANGELOG_URL =
    process.env.REACT_APP_CHANGELOG_URL || '/changelog'

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