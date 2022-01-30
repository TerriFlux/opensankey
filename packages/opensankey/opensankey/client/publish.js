var shell = require('shelljs')
shell.echo('hello world')
shell.cd('build')
shell.ls('*layout.json').forEach(function (file,i) {
  shell.sed('-i', '^{', 'window.sankey.filiere'+i+' = {', file)
})