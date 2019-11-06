const express = require('express')
const redis = require('redis')
const fetch = require('node-fetch')

const PORT = process.env.PORT || 5000
const REDIS_PORT = 6379

const app = express();

const client = redis.createClient(REDIS_PORT)

async function getRepos(req, res, next) {
  try {
    console.log('fetching data ...')
    const { username } = req.params
    const response = await fetch(`https://api.github.com/users/${username}`)
    const data = await response.json()
    const repos = data.public_repos
    if (repos) client.setex(username, 3600, repos)
    res.send(setResponse(username, repos))
  } catch (error) {
    console.error(error)
    res.status(500)
  }
}

function setResponse(username, repos) {
  return `<h1>${username} has ${repos} github repos</h1>`;
}

function cache(req, res, next) {
  const { username } = req.params
  client.get(username, function (err, data) {
    if (err) throw err
    if (data !== null) {
      res.send(setResponse(username, data))
    } else {
      next()
    }
  })
}

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, function () {
  console.log(`listening to port ${PORT}`)
})