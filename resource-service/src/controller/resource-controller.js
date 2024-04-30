/**
 * Module for the ResourceController.
 *
 * @author Dongzhu Tan
 * @version 3.1.0
 */

import { ImageModel } from '../model/ImageModel.js'
import mongoose from 'mongoose'

/**
 * Encapsulates a controller.
 */
export class ResourceController {
  /**
   * Provide req.doc to the route if :id is present, checking if a task exists before performing operations like update or delete.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The value of the id for the image to load.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async loadImageDocument (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid Identifier')
      error.status = 404
      return next(error)
    }

    try {
      const imageDoc = await ImageModel.findById(id)

      // If the task document is not found, throw an error.
      if (!imageDoc) {
        const error = new Error('The image document you requested does not exist.')
        error.status = 404
        return next(error)
      }

      // Provide the task document to req.
      req.doc = imageDoc

      next()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Displays a list of all images.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async showAllImagesFromUser (req, res, next) {
    try {
      // Assuming each image document has a 'userId' field that matches 'req.user.id'.
      const userImages = await ImageModel.find({ userId: req.user.userID })

      if (userImages.length === 0) {
        const error = new Error('No images found for this user.')
        error.status = 404
        return next(error)
      }

      const viewImageData = {
        images: userImages.map(image => image.toObject()),
        message: 'Images fetching successful!'
      }

      res.status(200).json(viewImageData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a image and save it to image server.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async createImage (req, res, next) {
    if (!req.body.data && !req.body.contentType && !req.body.location && !req.body.description) {
      const error = new Error('The request cannot or will not be processed due to client error (for example, validation error).')
      error.status = 400
      return next(error)
    }

    try {
      const body = {
        data: req.body.data,
        contentType: req.body.contentType,
        description: req.body.description,
        location: req.body.location
      }

      const response = await fetch('https://courselab.lnu.se/picture-it/images/api/v1/images', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Private-Token': process.env.X_API_PRIVATE_TOKEN
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Image service error: ${response.status} - ${errorText}`)
      }

      // Extract the JSON body from the response.
      const imageServiceResponse = await response.json()

      console.log('req.user.id at creat image: ' + req.user.id)

      const imageDocument = await ImageModel.create({
        imageUrl: imageServiceResponse.imageUrl,
        description: req.body.description,
        location: req.body.location,
        imageId: imageServiceResponse.id,
        userId: req.user.userID
      })

      console.log('New image document has been save to database: ' + imageDocument)
      res.status(201).json(imageDocument)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Show the specific image with its id.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async showImageWithId (req, res, next) {
    try {
      // Using 'imageId' field to find the document.
      const image = await ImageModel.findOne({
        imageId: req.params.imageId,
        userId: req.user.userID // req.user.userID should be the userId of the logged-in user.
      })

      if (!image) {
      // If the image document is not found, return a 404 Not Found response.
        const error = new Error('The requested resource was not found or you do not have permission to update it.')
        error.status = 404
        return next(error)
      }

      // Respond with the image document
      res.status(200).json(image)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update a specific image with its imageId.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async updateTheWholeImage (req, res, next) {
    if (!req.body.data && !req.body.contentType && !req.body.location && !req.body.description) {
      const error = new Error('The request cannot or will not be processed due to client error (for example, validation error).')
      error.status = 400
      return next(error)
    }

    try {
      // Find the image by imageId and verify that the userId matches the logged-in user's id.
      const updateImage = await ImageModel.findOne({
        imageId: req.params.imageId,
        userId: req.user.userID // req.user.userID should be the userId of the logged-in user.
      })

      if (!updateImage) {
      // If the image is not found or the userId does not match, return a 404 error.
        const error = new Error('The requested resource was not found or you do not have permission to update it.')
        error.status = 404
        return next(error)
      }

      const body = {
        data: req.body.data,
        contentType: req.body.contentType,
        description: req.body.description,
        location: req.body.location
      }

      // Update on the image server.
      const response = await fetch(`https://courselab.lnu.se/picture-it/images/api/v1/images/${updateImage.imageId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Private-Token': process.env.X_API_PRIVATE_TOKEN
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Image server error: ${response.status} - ${errorText}`)
      }

      // Update local database only after a successful update on the remote server.
      const updateDocument = await ImageModel.findOneAndUpdate({ imageId: updateImage.imageId }, {
        data: req.body.data,
        contentType: req.body.contentType,
        description: req.body.description,
        location: req.body.location
      }, { new: true })
      console.log('update document:' + updateDocument)

      res.status(204).json(updateDocument)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Partial update the specific image with its imageId.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async partialUpdateOneImage (req, res, next) {
    try {
      // Check if at least one field is provided for update.
      const fieldsToUpdate = ['data', 'contentType', 'description', 'location']

      const hasAtLeastOneField = fieldsToUpdate.some(field => Object.prototype.hasOwnProperty.call(req.body, field))

      // I got inspiration here:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
      // https://chat.openai.com/

      const partialUpdateImage = await ImageModel.findOne({
        imageId: req.params.imageId,
        userId: req.user.userID // req.user.userID should be the userId of the logged-in user.
      })

      if (!hasAtLeastOneField) {
        const error = new Error('The requested resource was not found or you do not have permission to update it.')
        error.status = 404
        return next(error)
      }

      const body = {
        description: req.body.description
      }

      // Update on the image server.
      const response = await fetch(`https://courselab.lnu.se/picture-it/images/api/v1/images/${partialUpdateImage.imageId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Private-Token': process.env.X_API_PRIVATE_TOKEN
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Image server error: ${response.status} - ${errorText}`)
      }

      // Update local database only after a successful update on the remote server.
      const partialUpdateDocument = await ImageModel.findOneAndUpdate({ imageId: partialUpdateImage.imageId }, {
        description: req.body.description
      }, { new: true })
      console.log('Partial update document:' + partialUpdateDocument)

      res.status(204).json()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete the specific image with its imageId.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @returns {void} -Sends an HTTP response with status information but does not return a value explicitly.
   */
  async deleteOneImage (req, res, next) {
    try {
      const imageDocument = await ImageModel.findOne({
        imageId: req.params.imageId,
        userId: req.user.userID // req.user.userID should be the userId of the logged-in user.
      })

      if (!imageDocument) {
        const error = new Error('The requested resource was not found or you do not have permission to update it.')
        error.status = 404
        return next(error)
      }

      // Prepare the DELETE request to the image server.
      const response = await fetch(`https://courselab.lnu.se/picture-it/images/api/v1/images/${req.params.imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Private-Token': process.env.X_API_PRIVATE_TOKEN
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Image service error: ${response.status} - ${errorText}`)
      }

      // Proceed to delete the image record from the local database if the server deletion was successful.
      const deletedImage = await ImageModel.findOneAndDelete({ imageId: req.params.imageId })

      if (!deletedImage) {
        const error = new Error('The requested resource was not found or you do not have permission to update it.')
        error.status = 404
        return next(error)
      }

      res.status(204).json()
    } catch (error) {
      next(error)
    }
  }
}
