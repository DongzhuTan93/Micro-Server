/**
 * @file API version 1 router.
 * @module routes/router
 * @author Dongzhu Tan
 */

import express from 'express'
import { router as accountRouter } from './accountRouter.js'

export const router = express.Router()

router.use('/auth', accountRouter)
