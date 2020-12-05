-- Import redis library and initialize
local redis_lib = require "resty.redis"
local redis = redis_lib:new()

redis:set_timeouts(1000, 1000, 1000) -- 1 sec

-- Import HTTP Client library and initialize
local http_lib = require "resty.http"
local http = http_lib.new()
http:set_timeout(5000)

-- Time Stuff
local time_now = os.time()
local seconds_to_expire = 120 -- 2 minutes

-- Json library
local json = require "cjson"

-- local root_url = "https://orca.bcferries.com/cc/marqui/"
local root_url = "https://www.bcferries.com"

local function redis_connect()
  local i = 0
  local success = true
  repeat
    i = i + 1
    if i > 1 then
      ngx.log(ngx.ERR, "Redis connect attempt #" .. i)
    end
    local ok, err = redis:connect(os.getenv("REDIS_URL"), 6379)
    if not ok then
      success = false
    end
  until(success or i > 4)
  return success
end

local function net_request_page(page_url)
  ngx.log(ngx.ERR, "Requesting: " .. page_url)
  local response, err = http:request_uri(
    page_url, {
    method = "GET",
    ssl_verify = false,
  })
  local trimmed_body
  if not response then
    ngx.log(ngx.ERR, "Error requesting page: " .. err)
    return false
  else
    -- trim response body whitespace
    trimmed_body = (response.body:gsub("^%s*(.-)%s*$", "%1"))
  end
  ngx.log(ngx.ERR, "Finished requesting page")

  -- ngx.log(ngx.ERR, string.sub((trimmed_body), 1, 15))
  return trimmed_body
end

local function set_cache(key, value)
  ngx.log(ngx.ERR, "Updating cache")
  local value_as_json = json.encode(value)
  local ok, error = redis:set(key, value_as_json)
  if not ok then
    ngx.log(ngx.ERR, "REDIS: Error setting " .. key .. " : " .. error)
    return false
  end
  ngx.log(ngx.ERR, "Cache succesfully updated")
  return true
end

local function get_cache(key)
  ngx.log(ngx.ERR, "Retrieving cache for " .. key)

  local cache, error = redis:get(key)
  if not cache or cache == ngx.null then
    if error then
      ngx.log(ngx.ERR, "REDIS: Couldn't retrieve " .. key .. " : " .. error)
    else
      ngx.log(ngx.ERR, "REDIS: Couldn't retrieve " .. key)
    end
    return false
  end
  ngx.log(ngx.ERR, "Found in cache, converting back into Lua object...")
  local cache_as_json_string = tostring(cache)
  local cache_as_table = json.decode(cache_as_json_string)
  ngx.log(ngx.ERR, tostring(cache_as_table.expires))
  ngx.log(ngx.ERR, "Successfully converted cache object, returning...")
  return cache_as_table
end

local function cache_is_expired(cache_entry)
  -- ngx.log(ngx.ERR, "Compare time_now:" .. time_now .. " with cache_entry.expires:" .. tostring(cache_entry.expires))
  if ngx.null == cache_entry.expires then
    ngx.log(ngx.ERR, "Cache entry null")
    return false
  end
  if time_now < tonumber(cache_entry.expires) then
    ngx.log(ngx.ERR, "Cache expiry is valid, still fresh")
    return true
  end
  ngx.log(ngx.ERR, "Cache has expired")
  return false
end

local function get_page(page_name)
  -- ngx.log(ngx.ERR, "GET_PAGE(" .. page_name ..")")
  local page_result
  local page_cache = get_cache(page_name)
  if not page_cache or not cache_is_expired(page_cache) then
    -- cache no good, go get the page again
    local net_page = net_request_page(root_url .. page_name)
    if not net_page then
      local json_response = json.encode({
        error = "Couldn't request data from host"
      })
      ngx.status = ngx.HTTP_SERVICE_UNAVAILABLE
      ngx.header['Retry-After'] = 1
      ngx.say(json_response)
      return
    end
    local time_now = os.time()
    local expires_at = time_now + seconds_to_expire
    -- ngx.log(ngx.ERR, "Save to cache with expiry date:" .. tostring(expires_at))
    local cache_entry = {
      page = net_page,
      expires = expires_at
    }

    local result = set_cache(page_name, cache_entry)
    page_result = cache_entry
  else
    ngx.log(ngx.ERR, "Returning cached result...")
    page_result = page_cache
  end
  ngx.header['expires'] = ngx.http_time(tonumber(page_result.expires))
  ngx.status = ngx.HTTP_OK
  ngx.say(json.encode({page = page_result.page}))
  return
end

local redis_success = redis_connect()
if not redis_success then
  ngx.log(ngx.ERR, "Error connecting to redis.")
  ngx.status = ngx.HTTP_SERVICE_UNAVAILABLE
  ngx.header['Retry-After'] = 1
  ngx.say(json.encode({error = "Error connecting to redis."}))
  return
end

-- sub(5) to trim '/api' from the beginning of the uri
local request_uri = ngx.var.request_uri:sub(5)

local page_lookup = {
  ["/small"] = "/cc-route-info",
  ["/big"] = "/route-info"
}

local page_to_request = page_lookup[request_uri]

if page_to_request == nil then
  page_to_request = request_uri
end

local response = get_page(page_to_request)
