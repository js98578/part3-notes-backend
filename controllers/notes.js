const notesRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Note = require('../models/note')
const User = require('../models/user')
const NoteStack = require('../models/notestack')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

notesRouter.get('/get-users-notes/:username', async (request, response) => {
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  console.log(decodedToken)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (
    decodedToken.username.toString() === request.params.username.toString() ||
    decodedToken.admin === true
  ) {
    const notes = await Note.find({ username: request.params.username })
      .populate('user', { username: 1, name: 1 })
      .populate('noteStack', { title: 1 });
    response.json(notes.reverse().map(note => note.toJSON));
  }
});

notesRouter.put('/:id', async (request, response, next) => {
  const body = request.body
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  
  const foundNoteStack = await NoteStack.findById(request.params.id)
  let noteStack = 'default'
  if (foundNoteStack) {
    response.json(note.toJSON())
  } else {
    response.status(404).end()
  }

  const note = {
    title: body.title,
    content: body.content,
    noteStack: noteStack,
    lastModifiedDate: new Date(),
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote.toJSON())
    })
    .catch(error => next(error))
})

notesRouter.get('/:id', async (request, response) => {
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const note = await Note.findById(request.params.id)

  if (decodedToken.id.toString() === note.user.toString() || decodedToken.admin === true) {
    if (note) {
      response.json(note.toJSON())
    } else {
      response.status(404).end()
    }
  }
})

notesRouter.post('/', async (request, response) => {
  const body = request.body
  const token = getTokenFrom(request)

  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const note = new Note({
    content: body.content,
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    user: user._id,
    noteStack: body.noteStack,
    title: body.title,
  })

  const savedNote = await note.save()
  user.notes = user.notes.concat(savedNote._id)
  await user.save()

  response.json(savedNote.toJSON())
})

notesRouter.delete('/:id', async (request, response) => {
  const token = getTokenFrom(request)

  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  await Note.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

module.exports = notesRouter