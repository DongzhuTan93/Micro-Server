/**
 * @file Defines the main application.
 * @author Dongzhu Tan
 * @version 3.1.0
 */

import '@lnu/json-js-cycle'
import cors from 'cors'
import express from 'express'
import httpContext from 'express-http-context' // Must be first!
import { router } from './routes/router.js'
import helmet from 'helmet'
import logger from 'morgan'
import { randomUUID } from 'node:crypto'
import { connectToDatabase } from './config/mongoose.js'

import dotenv from 'dotenv'

dotenv.config()

try {
  // Connect to MongoDB.
  await connectToDatabase(process.env.DB_CONNECTION_STRING)

  // Create an Express application.
  const app = express()

  // The payload size for requests to the server must not exceed 500kb.
  app.use(express.json({ limit: '500kb' }))

  // Set various HTTP headers to make the application little more secure (https://www.npmjs.com/package/helmet).
  app.use(helmet())

  // Enable Cross Origin Resource Sharing (CORS) (https://www.npmjs.com/package/cors).
  app.use(cors())

  // Set the base URL to use for all relative URLs in a document.
  const baseURL = process.env.BASE_URL || '/'

  // Set up a morgan logger using the dev format for log entries.
  app.use(logger('dev'))

  // Add the request-scoped context.
  // NOTE! Must be placed before any middle that needs access to the context!
  //       See https://www.npmjs.com/package/express-http-context.
  app.use(httpContext.middleware)

  // Middleware to be executed before the routes.
  app.use((req, res, next) => {
    // Add a request UUID to each request and store information about
    // each request in the request-scoped context.
    req.requestUuid = randomUUID()
    httpContext.set('request', req)
    res.locals.baseURL = baseURL

    next()
  })

  // Register routes.
  app.use(baseURL, router)

  // Error handler.
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      // Ensure a valid status code is set for the error.
      // If the status code is not provided, default to 500 (Internal Server Error).
      // This prevents leakage of sensitive error details to the client.
      if (!err.status) {
        err.status = 500
        err.message = 'An unexpected condition was encountered'
      }

      // Send only the error message and status code to prevent leakage of
      // sensitive information.
      res
        .status(err.status)
        .json({
          status: err.status,
          message: err.message
        })

      return
    }

    // ---------------------------------------------------
    // ⚠️ WARNING: Development Environment Only!
    //             Detailed error information is provided.
    // ---------------------------------------------------

    // Deep copies the error object and returns a new object with
    // enumerable and non-enumrele properties (cyclical structures are handled).
    const copy = JSON.decycle(err, { includeNonEnumerableProperties: true })

    return res
      .status(err.status || 500)
      .json(copy)
  })

  // Starts the HTTP server listening for connections.
  const server = app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${server.address().port}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.log(err)
  process.exitCode = 1
}
