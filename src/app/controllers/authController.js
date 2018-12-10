const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const mailer = require('../modules/mailer')

const authConfig = require('../../config/auth')

const User = require('../models/User')

const router = express.Router()

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    })
}

router.post('/register', async (req, res) => {
    const { email } = req.body

    try {
        //Verificação de usuário existente.
        if (await User.findOne({ email })) {
            return res.status(400).send({ error: 'User already exists' })
        }
        //Criação de novo usuário.
        const user = await User.create(req.body)

        user.password = undefined

        return res.send({
            user,
            token: generateToken({ id: user.id })
        })
    } catch (err) {
        return res.status(400).send({ error: 'Registration failed' })
    }
})

router.post('/authenticate', async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return res.status(400).send({ error: 'User not found' })
    }

    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).send({ error: 'Invalid password' })
    }

    user.password = undefined

    res.send({
        user,
        token: generateToken({ id: user.id })
    })
})

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        console.log(user)
        if (!user) {
            return res.status(400).send({ error: 'User not found' })
        }

        //Token vai vir como string em hexadecimal.
        const token = crypto.randomBytes(20).toString('hex')

        //Data de expiração do token pegando a hora atual e add + 1h.
        const now = new Date()
        now.setHours(now.getHours() + 1)

        //Alterando o model como o token e data de expiração, a partir do user.id.
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        })

        mailer.sendMail({
            to: email,
            from: 'matheuscastro.si.ufal@gmail.com',
            template: 'auth/forgot_password',
            context: { token }
        }, (err) => {
            if (err) {
                return res.status(400).send({ error: 'Cannot send forgot password email' })
            }

            res.send()
        })
    } catch (err) {
        return res.status(400).send({ error: 'Erro on forgot password, try again' })
    }
})

router.post('/reset_password', async (req, res) => {
    const { email, token, password } = req.body

    try {
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires')

        if (!user) {
            return res.status(400).send({ error: 'User not found' })
        }

        if(token !== user.passwordResetToken){
            return res.status(400).send({ error: 'Token ivalid'})
        }

        const now = new Date()

        if(now > user.passwordResetExpires){
            return res.status(400).send({ error: 'Token expired, generate a new one' })
        }

        user.password = password

        await user.save()

        res.send()

    } catch (err) {
        res.status(400).send({ error: 'Cannot reset password, try again' })
    }
})
module.exports = app => app.use('/auth', router)