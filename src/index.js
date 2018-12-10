const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(cors())

//Função do body-parser para que ele entenda quando for enviado uma requisição para API com informações em JSON.
app.use(bodyParser.json())
//Função para decodar parametros da URL.
app.use(bodyParser.urlencoded({ extended: false }))

//Referenciando o authController/projectController e repassando o APP.
require('./app/controllers/index')(app)

app.listen(3001, function () {
    console.log('App listening on port 3001!')
})