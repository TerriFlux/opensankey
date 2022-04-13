var shell = require('shelljs')
const zl = require('zip-lib')

shell.cd('build')
var files = []
const zip = new zl.Zip()
shell.ls().forEach(function (file) {
  if (file.includes('reconciled.xlsx') || file.includes('pdf') ) {
    zip.addFile(file)
  }
})

// Adds a file from the file system
// zip.addFile("path/to/file.txt", "renamedFile.txt");
// zip.addFile("path/to/file2.txt", "folder/file.txt");
// // Adds a folder from the file system, and naming it `new folder` within the archive
// zip.addFolder("path/to/folder", "new folder");
// Generate zip file.
zip.archive(process.argv[2]+'.zip').then(function () {
  console.log('done')
}, function (err) {
  console.log(err)
})