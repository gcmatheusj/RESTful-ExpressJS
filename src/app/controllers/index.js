const fs = require('fs')
const path = require('path')

//Exporta todos os arquivos da pasta que não index e não começam com ponto.
module.exports = app => {
    fs
        .readdirSync(__dirname)
        .filter(file => ((file.indexOf('.') !== 0 && (file !== "index.js"))))
        .forEach(file => require(path.resolve(__dirname, file))(app))
}