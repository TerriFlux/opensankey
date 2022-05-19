var shell = require('shelljs')
shell.cd('build')
shell.ls('*.html').forEach(function (file,i) {
  shell.sed('-i', 'has_header=!0' , 'has_header=0', file)
  shell.sed('-i', 'footer=!0'     , 'footer=0', file)
})
