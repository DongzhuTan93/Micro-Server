/**
 * @file API version 1 router.
 * @module routes/router
 * @author Dongzhu Tan
 */

import express from 'express'

import { router as resourceRouter } from './resourceRouter.js'

export const router = express.Router()

router.get('/', (req, res) => res.json({ message: '{"message":"Hooray! Welcome to version 1 of this very simple RESTful API! (Resource)"}' }))
router.use('/images', resourceRouter)
