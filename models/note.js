const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
  title: String,
  content: {
    type: String,
  },
  createdDate: Date,
  lastModifiedDate: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  noteStack: { type: mongoose.Schema.Types.ObjectId, ref: 'NoteStack' }
})

noteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Note', noteSchema)
