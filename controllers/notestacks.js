const noteStackRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Note = require('../models/note')
const User = require('../models/user')
const NoteStack = require('../models/notestack')

const getTokenFrom = (request) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

noteStackRouter.get('/get-users-notestacks/:id', async (request, response) => {
  try {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({error: 'token missing or invalid'})
    }

    if (decodedToken.id.toString() === request.params.id || decodedToken.admin === true) {
      const noteStacks = await NoteStack
        .find({user: request.params.id})
      response.json(noteStacks.map(NoteStack.format))
    } else {
      response.status(401).send({error: 'token error'})
    }

  } catch (exception) {
    console.log(exception)
    response.status(400).send({error: 'malformatted id or not found'})
  }

})


noteStackRouter.get('/:id', async (request, response) => {
  try {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({error: 'token missing or invalid'})
    }

    const noteStack = await NoteStack
      .find({_id: request.params.id})

    if (decodedToken.id.toString() === noteStack.user || decodedToken.admin === true) {

      response.json(NoteStack.format(noteStack))
    } else {
      response.status(401).send({error: 'token error'})
    }

  } catch (exception) {
    console.log(exception)
    response.status(400).send({error: 'malformatted id or not found'})
  }

})

noteStackRouter.get('/notes-and-stack/:id', async (request, response) => {
  try {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({error: 'token missing or invalid'})
    }

    const noteStack = await NoteStack
      .findById(request.params.id)
      .populate('notes')

    if (decodedToken.id.toString() === noteStack.user.toString() || decodedToken.admin === true) {

      response.json(NoteStack.format(noteStack))
    } else {
      response.status(401).send({error: 'token error'})
    }

  } catch (exception) {
    console.log(exception)
    response.status(400).send({error: 'malformatted id or not found'})
  }

})


noteStackRouter.delete('/:id', async (request, response) => {
  try {

    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({error: 'token missing or invalid'})
    }
    const noteStack = await NoteStack.findById(request.params.id)

    if (decodedToken.id.toString() === noteStack.user.toString() || decodedToken.admin === true) {
      //Poistetaan viittaus notestackiin käyttäjältä
      const user = await User.findById(noteStack.user);
      console.log(user)
      user.noteStacks = user.noteStacks.filter(noteStack => noteStack.toString() !== request.params.id.toString())
      await user.save()

      await NoteStack.findByIdAndRemove(request.params.id)

      response.status(204).end()
    } else {
      response.status(401).send({error: 'token error'})
    }


  } catch (exception) {
    console.log(exception)
    response.status(400).send({error: 'malformatted id'})
  }
})

noteStackRouter.post('/', async (request, response) => {
  const body = request.body

  try {
    const token = getTokenFrom(request)
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken.id) {
      return response.status(401).json({error: 'token missing or invalid'})
    }

    if (body.title === undefined) {
      return response.status(400).json({error: 'title missing'})
    }

    const user = await User.findById(decodedToken.id)

    const noteStack = new NoteStack({
      title: body.title,
      user: decodedToken.id
    })

    const savedNoteStack = await noteStack.save()

    user.noteStacks = user.noteStacks.concat(savedNoteStack._id)
    await user.save()

    response.json(NoteStack.format(noteStack))
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({error: exception.message})
    } else {
      console.log(exception)
      response.status(500).json({error: 'something went wrong...'})
    }
  }
})

noteStackRouter.put('/:id', (request, response) => {
  const body = request.body

  const note = {
    title: body.title,
    content: body.content,
    important: body.important,
    noteStack: body.noteStack,
  }

  Note
    .findByIdAndUpdate(request.params.id, note, {new: true})
    .then(updatedNote => {
      response.json(Note.format(updatedNote))
    })
    .catch(error => {
      console.log(error)
      response.status(400).send({error: 'malformatted id'})
    })
})

module.exports = noteStackRouter
