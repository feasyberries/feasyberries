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

local root_url = "https://orca.bcferries.com/cc/marqui/"

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

  local ok, error = redis:set(key, value)
  if not ok then
    ngx.log(ngx.ERR, "REDIS: Error setting " .. key .. " : " .. error)
    return false
  end

  local time_now = os.time()

  local seconds_to_expire = 120 -- 2 minutes
  local time_now = os.time()
  local expires_at = time_now + seconds_to_expire

  local expiry_key = key .. '_expires'
  local ok, error = redis:set(expiry_key, expires_at)
  if not ok then
    ngx.log(ngx.ERR, "REDIS: Error setting " .. expiry_key .. " : " .. error)
    return false
  end
  return true
end

local function get_cache(key)
  ngx.log(ngx.ERR, "Retrieving cache for " .. key)

  local cache, error = redis:get(key)
  if not cache then
    ngx.log(ngx.ERR, "REDIS: Couldn't retrieve " .. key .. " : " .. error)
    return false
  end
  local expiry_key = key .. '_expires'

  local expiry, error = redis:get(expiry_key)
  if error then
    ngx.log(ngx.ERR, "REDIS: Error retrieving key: " .. expiry_key .. " : " .. error)
    return false
  end

  if not expiry or expiry == ngx.null then
    ngx.log(ngx.ERR, "REDIS: No value found for: " .. expiry_key)
    return false
  end
  expiry = tonumber(expiry)
  local time_now = os.time()
  if time_now > expiry then
    ngx.log(ngx.ERR, "REDIS: Cache expired for " .. key)
    return false
  end
  ngx.log(ngx.ERR, "Found in cache, returning...")
  return cache
end

local function get_page(page_name)
  -- ngx.log(ngx.ERR, "GET_PAGE(" .. page_name ..")")
  local page_result
  local page_cache = get_cache(page_name)
  if not page_cache then
    local net_page = net_request_page(root_url .. page_name)
    if not net_page then
      local json_response = json.encode({
        error = "Couldn't request data from host"
      })
      ngx.say(json_response)
      return
    end
    local result = set_cache(page_name, net_page)
    page_result = net_page
  else
    page_result = page_cache
  end

  local json_response = json.encode({
    data = page_result
  })
  ngx.status = ngx.HTTP_OK
  ngx.say(json_response)
  return
end

local redis_success = redis_connect()
if not redis_success then
  ngx.log(ngx.ERR, "What am I supposed to do without redis?")
  return
end
local request_uri = ngx.var.request_uri
local page_lookup = {
  ["/port"] = "at-a-glance.asp",
  ["/boat"] = "actualDepartures.asp"
}
local page_to_request = page_lookup[request_uri]

local response = get_page(page_to_request)
