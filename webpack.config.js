const path = require('path')
const HappyPack = require('happypack')
const WebpackMd5Hash = require('webpack-md5-hash')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const devServer = require('@webpack-blocks/dev-server2')

const {
  addPlugins, createConfig, entryPoint, env, setOutput, sourceMaps, defineConstants, webpack,
} = require('@webpack-blocks/webpack2')

const host = process.env.HOST || 'localhost'
const port = (process.env.PORT + 1) || 3001
const publicPath = `/${process.env.PUBLIC_PATH || ''}/`.replace('//', '/')

const sourcePath = path.join(__dirname, 'src')
const outputPath = path.join(__dirname, 'dist')
const serverPath = path.join(sourcePath, 'server')

const isVendor = ({ userRequest }) => (
  userRequest &&
  userRequest.indexOf('node_modules') >= 0 &&
  userRequest.match(/\.js$/)
)

const config = createConfig([
  entryPoint({
    app: sourcePath,
  }),
  setOutput({
    filename: '[name].[hash].js',
    path: outputPath,
    publicPath,
  }),
  defineConstants({
    'process.env.NODE_ENV': process.env.NODE_ENV,
    'process.env.PUBLIC_PATH': publicPath,
  }),
  addPlugins([
    new HappyPack({
      loaders: ['babel-loader'],
      cacheContext: {
        env: process.env.NODE_ENV,
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, 'public/index.html'),
    }),
  ]),
  () => ({
    resolve: {
      modules: ['src', 'node_modules'],
    },
    module: {
      rules: [
        { test: /\.jsx?$/, loader: 'happypack/loader', exclude: /node_modules/ },
        { test: /\.png$/, loader: 'url-loader?prefix=images/&limit=8000&mimetype=image/png' },
        { test: /\.jpe?g$/, loader: 'url-loader?prefix=images/&limit=8000&mimetype=image/jpeg' },
        { test: /\.woff$/, loader: 'url-loader?prefix=fonts/&limit=8000&mimetype=application/font-woff' },
        { test: /\.woff2$/, loader: 'url-loader?prefix=fonts/&limit=8000&mimetype=application/font-woff2' },
        { test: /\.(ttf|eot)$/, loader: 'file-loader?prefix=fonts/' },
      ],
    },
  }),

  env('development', [
    devServer({
      contentBase: 'public',
      stats: 'errors-only',
      publicPath,
      host,
      port,
    }),
    sourceMaps(),
    addPlugins([
      new webpack.NamedModulesPlugin(),
    ]),
  ]),

  env('production', [
    setOutput({
      filename: '[name].[chunkHash].js',
      path: outputPath,
      publicPath,
    }),
    addPlugins([
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: isVendor,
      }),
      new WebpackMd5Hash(),
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    ]),
  ]),
])

module.exports = config
