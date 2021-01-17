require 'sinatra'
require 'redis'
require 'http'
require 'json'

set :port, ENV['APP_PORT']
set :bind, '0.0.0.0'
set :public_folder, __dir__ + '/src/svelte/public'


def net_request(path)
  root_url = 'https://www.bcferries.com/'
  full_uri = root_url + path
  # logger.info "getting #{full_uri}"
  response = HTTP.get(root_url + path)
  retries = 0
  until response.status.success? || retries > 3 do
    retries = retries + 1
    response = HTTP.get(root_url + path)
  end
  if response.status.success?
    response_body = response.to_s.strip
    return response_body
  else
    # error time
  end
end

get '/' do
  # serve static files
  send_file 'src/svelte/public/index.html'
end

get '/api/*' do
  redis = Redis.new(url: ENV['REDIS_URL'])
  expire_seconds = 120

  # is what we want in cache?
  path = params['splat'].first
  # logger.info(path)
  redis_cache = redis.get(path)
  now = Time.now.to_i
  if redis_cache.nil? || redis_cache['expires'].to_i < now
    # not found in cache, request from source
    response = net_request(path)
    # save to cache and return response
    payload = {
      page: response,
      expires: now + expire_seconds
    }
    redis.set(path, payload)
    redis_cache = payload
  end
  return JSON.generate(redis_cache)
end