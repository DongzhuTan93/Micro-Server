/**
 * @file Defines the AccountController class.
 * @module controllers/AccountController
 * @author Dongzhu Tan
 * @version 3.1.0
 */

import { UserModel } from '../models/UserModel.js'
import createError from 'http-errors'
import jwt from 'jsonwebtoken'
import fs from 'fs/promises'

/**
 * Encapsulates a controller.
 */
export class AccountController {
  /**
   * Registers a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async register (req, res, next) {
    try {
      const { username, password, firstName, lastName, email } = req.body

      const userDocument = await UserModel.create({
        username,
        password,
        firstName,
        lastName,
        email
      })

      console.log('New user: ' + userDocument)

      res.status(201).json({ message: 'Registered user successful!' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Authenticates a user.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async login (req, res, next) {
    try {
      const userDocument = await UserModel.authenticate(req.body.username, req.body.password)

      console.log('Users name and password at login:' + userDocument)

      // Read the private key from private.pem file.
      const privateKey = await fs.readFile('./private.pem', 'utf8')

      const payload = {
        username: userDocument.username
      }

      // Create the access token with the shorter lifespan.
      const accessToken = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: process.env.ACCESS_TOKEN_LIFE
      })

      // Set the JWT token as an HttpOnly cookie.
      res.cookie('jwtToken', accessToken, {
        httpOnly: true,
        secure: true, // Enable this if using HTTPS in production.
        sameSite: 'strict' // Adjust based on your requirements.
      })

      res.status(201).json({ message: 'User login successful! AccessToken: ' + accessToken })
    } catch (error) {
      // Authentication failed.
      const err = createError(401)
      err.cause = error
      next(err)
    }
  }
}
