/**
 * @file Authentication  middlewares.
 * @module middlewares/auth
 * @author Dongzhu Tan
 * @version 3.1.0
 */

import jwt from 'jsonwebtoken'
import fs from 'fs/promises'

/**
 * Authenticates a request based on a JSON Web Token (JWT).
 *
 * This middleware function inspects the 'Authorization' header for a bearer token, which it then attempts
 * to verify and decode using a public RSA key. If the token is present and valid, the decoded user information
 * is attached to the 'req.user' property, and the request is allowed to proceed to the next middleware or
 * route handler. If the token is not present, a 401 Unauthorized status with an error message is returned
 * to the client. If the token is present but invalid or expired, a 403 Forbidden status with an error message
 * is returned. Errors encountered during verification or file reading are passed to the next error-handling
 * middleware.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
 */
export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) {
    // if no token, return 401 Unauthorized.
    const error = new Error('Access token invalid or not provided.')
    error.status = 401
    return next(error)
  }

  try {
    const publicKey = await fs.readFile('./public.pem', 'utf8')

    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, user) => {
      if (err) {
        // if token is not valid, return 403 Forbidden.
        const error = new Error('The request contained valid data and was understood by the server, but the server is refusing action due to the authenticated user not having the necessary permissions for the resource.')
        error.status = 403
        return next(error)
      }
      console.log('Decoded JWT:', user) // log the decoded user object before setting req.user. This will verify that the token is being decoded properly.
      req.user = user // set the user on the request object for downstream use.
      console.log('users id from authenticateJWT: ' + req.user.userID)

      next()
    })
  } catch (error) {
    return next(error)
  }
}

// I got inspiration here: https://gitlab.lnu.se/1dv026/student/dt222ha/exercises/example-restful-tasks-with-jwt/-/blob/main/src/middlewares/auth.js?ref_type=heads
// I got inspiration from ChatGPT
