# Open-Sankey

## Description

Site en ligne open-sankey.fr

## Repository

OpenSankey is available as:
- Source: https://gitlab.com/terriflux-public/OpenSankey

## Executables

- npm package: https://www.npmjs.com/package/open-sankey
- pypi package https://pypi.org/project/OpenSankey/
    - dependency: https://pypi.org/project/SankeyExcelParser/

## How to use it

### Examples online

Some examples of its use can be run online:
- From React code
    - OpenSankey Viewer React: https://codesandbox.io/p/sandbox/opensankeyviewer-5z2zp3
    - OpenSankey Viewer React TypeScript: https://codesandbox.io/p/sandbox/sweet-gauss-25qp9k
    - OpenSankey Editor React TypeScript: https://codesandbox.io/p/sandbox/nostalgic-nash-7y3fth
- Directly from HTML
    - OpenSankey Viewer: https://codesandbox.io/p/sandbox/jolly-frost-hj74g3

### From Executables

To write

### From VSCode

To write

### With docker

How to install docker : https://docs.docker.com/engine/install/

Create docker image with `sudo docker build -t opensankey:latest .`

Run docker image with server : `sudo docker run -p 8080:5000 -t opensankey:latest`

Run with docker compose : `sudo docker compose up -d`

Stop docker compose : `sudo docker compose down`

## Format
- python -m black .
- python -m autopep8 --in-place --aggressive --aggressive -r .