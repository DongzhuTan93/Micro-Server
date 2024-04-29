/**
 * @file API version 1 router.
 * @module routes/router
 * @author Dongzhu Tan
 */

import express from 'express'

import { authenticateJWT } from './../../../middlewares/auth.js'
import { ResourceController } from '../../../controller/resource-controller.js'

export const router = express.Router()
const resourceController = new ResourceController()

// Middleware to load a task document if :id is present.
router.param('id', (req, res, next, id) => resourceController.loadImageDocument(req, res, next, id))

// Map HTTP verbs and route paths to controller action methods.
router.get('/', authenticateJWT, (req, res, next) => resourceController.showAllImagesFromUser(req, res, next))

router.post('/', authenticateJWT, (req, res, next) => resourceController.createImage(req, res, next))

router.get('/:imageId', authenticateJWT, (req, res, next) => resourceController.showImageWithId(req, res, next))

router.put('/:imageId', authenticateJWT, (req, res, next) => resourceController.updateTheWholeImage(req, res, next))

router.patch('/:imageId', authenticateJWT, (req, res, next) => resourceController.partialUpdateOneImage(req, res, next))

router.delete('/:imageId', authenticateJWT, (req, res, next) => resourceController.deleteOneImage(req, res, next))
