var HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    'main': [
      './example/index.js'
    ]
  },
  output: {
    path: 'example',
    filename: 'index_bundle.js'
  },
  devtool: '#source-map',
  plugins: [new HtmlWebpackPlugin({
    title: 'grade-range-input',
    template: './example/template.html',
    inject: true
  })],
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ]
  }
}