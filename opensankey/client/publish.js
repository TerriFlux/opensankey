var shell = require('shelljs')
shell.echo('hello world')
shell.cd('build')
var j = 0
shell.ls('*layout.json').forEach(function (file) {
  if (file.includes('auto_layout') ) {
    return
  }
  shell.sed('-i', '^{', 'window.sankey.filiere'+j+' = {', file)
  j=j+1
})