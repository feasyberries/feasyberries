FROM ruby:3.0-buster

# Install curl
RUN apt-get install -y curl

# Install Node
RUN curl -sL https://deb.nodesource.com/setup_15.x | bash -
RUN apt-get install -y nodejs

# Install heroku cli
RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Install gems
RUN mkdir /feasyberries
WORKDIR /feasyberries
COPY Gemfile /feasyberries/Gemfile
COPY Gemfile.lock /feasyberries/Gemfile.lock
RUN bundle install

# Install js dependencies
# RUN npm install

EXPOSE 8080
EXPOSE 35729
