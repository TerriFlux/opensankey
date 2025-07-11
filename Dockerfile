# syntax=docker/dockerfile:1
FROM ubuntu:jammy

# Install global dependencies
RUN apt update
RUN apt install -y curl git sed
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt install -y nodejs
RUN apt install -y python3 python3-venv python3-pip
RUN npm install -g pnpm

# Create default user ubuntu
RUN useradd -ms /bin/bash ubuntu
ENV HOME=/home/ubuntu

# Copy app files
ENV APP_DIR=$HOME/OpenSankey
RUN mkdir $APP_DIR
COPY . $APP_DIR/
RUN chown -R ubuntu:ubuntu $APP_DIR

# Create virtual env - needed because of pip
USER ubuntu
ENV VIRTUAL_ENV=$HOME/env
RUN mkdir $VIRTUAL_ENV && python3 -m venv $VIRTUAL_ENV
ENV PATH=$VIRTUAL_ENV/bin:$PATH

# Install app
WORKDIR $APP_DIR
RUN git config --global safe.directory '*'
RUN git reset --hard && git clean -fdx
ENV NODE_ENV=production
RUN bash build_client.sh -I -B
RUN bash build_server.sh --from-frozen-requirement
RUN bash build_doc.sh

# Small adjustements
RUN cd opensankey/client && sed -i -e 's/\/static\//\/static\/opensankey\//g' ./build/index.html
RUN cd opensankey/client && sed -i -e 's/..\/static\//..\/..\/static\/opensankey\//g' ./build/static/css/*.css
ENV MFAData=$HOME/MFAData

# final configuration
EXPOSE 5000
CMD ["uwsgi", "--http", ":5000", "--module", "wsgi:application"]
