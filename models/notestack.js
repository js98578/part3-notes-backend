const mongoose = require('mongoose')

const noteStackSchema = new mongoose.Schema({
    title: String,
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

noteStackSchema.statics.format = (noteStack) => {
    return {
        id: noteStack._id,
        title: noteStack.title,
        notes: noteStack.notes,
        user: noteStack.user
    }
}

noteStackSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
  })
  

const NoteStack = mongoose.model('NoteStack', noteStackSchema)

module.exports = NoteStack