var shell = require('shelljs')
shell.cd('build')
var j = 0
shell.ls('*layout.json').forEach(function (file) {
  if (file.includes('auto_layout') ) {
    return
  }
  var files_root = file.split('_layout')[0]
  shell.sed('-i', '^{', 'window.sankey.'+files_root+' = {', file)
})