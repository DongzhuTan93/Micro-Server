/**
 * @file Defines the user model.
 * @module models/UserModel
 * @author Dongzhu Tan
 * @version 3.1.0
 */

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import validator from 'validator'
const { isEmail } = validator

// Create a schema.
const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'The username is required.'],
    unique: true,
    // - A valid username should start with an alphabet so, [A-Za-z].
    // - All other characters can be alphabets, numbers or an underscore so, [A-Za-z0-9_-].
    // - Since length constraint is 3-256 and we had already fixed the first character, so we give {2, 255}.
    // - We use ^ and $ to specify the beginning and end of matching.
    match: [/^[A-Za-z][A-Za-z0-9_-]{2,255}$/, 'Please provide a valid username']
  },
  password: {
    type: String,
    required: [true, 'The password is required.'],
    minLength: [10, 'The password must be of minimum length 10 characters.'],
    maxLength: [256, 'The password must be of maximum length 256 characters.']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required.'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required.'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [isEmail, 'Please provide a valid email address.']
  }
}, {
  timestamps: true,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitive information(When we send a Mongoose document (for example, a user record) to a client, it needs to be converted into a JSON format. This conversion is automatically triggered when you use operations like res.json(user) in an Express.js application).
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id // This removes the _id field from the JSON output. _id is MongoDB's internal identifier, and we might not want to expose it for reasons like security or simplicity for the client.
      delete ret.__v
    },
    virtuals: true // ensure virtual fields are serialized.
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Salts and hashes password before save.
schema.pre('save', async function () {
  this.password = await bcrypt.hash(this.password, 10)
})

/**
 * Authenticates a user.
 *
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @returns {Promise<UserModel>} A promise that resolves with the user if authentication was successful.
 */
schema.statics.authenticate = async function (username, password) {
  const userDocument = await this.findOne({ username })

  // If no user found or password is wrong, throw an error.
  if (!userDocument || !(await bcrypt.compare(password, userDocument.password))) {
    throw new Error('Invalid credentials.')
  }

  // User found and password correct, return the user.
  return userDocument
}

// Create a model using the schema.
export const UserModel = mongoose.model('User', schema)

// I got inspiration here: https://gitlab.lnu.se/1dv026/student/dt222ha/exercises/example-restful-tasks-with-jwt
