var https = require('https'),
    util = require('util'),
    prowl = function (config) {
        var $this = this;
        this.verbose = true;
        this.config = {
                body:{
                    apikey:null,
                    priority:0,
                    application:'node-prowl',
                    event:'LOG',
                    description:'Hello from node.'
                },
                options:{
                    host: 'prowl.weks.net',
                    port: 443,
                    path: '/publicapi/add',
                    method: 'POST'
                }
        };
    
        (function (config) {
            for (var key in config) {
                if ($this.config.options.hasOwnProperty(key)) {
                    $this.config.options[key] = config[key];
                } else if ($this.config.body.hasOwnProperty(key)) {
                    $this.config.body[key] = config[key];
                } else {
                    var msg = 'prowl: Unknown configuration option: "' + key + '".';
                    util.log(msg);
                    throw new Error(msg);
                }
            }
        })(config);
        
        function clone(obj) {
            var newObj = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key))
                    newObj[key] = obj[key];
            }
            return newObj;
        }
    
        function setVerbose(verbose) { this.verbose            = verbose; }
        function setAPIKey(key)      { this.config.apikey      = key;     }
        function setApplication(app) { this.config.application = app;     }
        function setEvent(event)     { this.config.event       = event;   }
        function setPriority(prio)   { this.config.priority    = prio;    }
        
        function post(description, event, priority, application, callback) {
            var boundary = Math.random(),
                body     = clone($this.config.body),
                options  = clone($this.config.options),
                postData = '';
            
            body.description = description || body.description;
            body.event       = event       || body.event;
            body.priority    = priority    || body.priority;
            body.application = application || body.application;
            for (var key in body) {
                postData += encodeField(boundary, key, body[key]);
            }
            options.headers = {
                'Content-Type' : 'multipart/form-data; boundary=' + boundary,
                'Content-Length' : Buffer.byteLength(postData)
            };
            if (typeof description === 'Function') callback = description;
            if (typeof event       === 'Function') callback = event;
            if (typeof priority    === 'Function') callback = priority;
            if (typeof application === 'Function') callback = application;
            var req = https.request(options, function(res) {
                var requestData = '';
                if ($this.verbose) util.log('prowl: response (code:' + res.statusCode + ') header >>> ' + util.inspect(res.header, true, null) + ' <<<<');
                res.setEncoding('utf8');
                res.on('data', function(data) {
                    if ($this.verbose) util.log('prowl: on.data ('+ data + ')');
                    requestData += data;
                });
                res.on('end', function(data) {
                    if (data)
                        requestData += data;
                    if ($this.verbose) util.log('prowl: on.end >>> ' + requestData);
                    if (callback)
                        callback(null, requestData);
                });
            });
            req.write(postData);
            req.end();
            req.on('error', function(err) {
                util.log('prowl: ERROR >>> ' + err);
                if (callback)
                    callback(err, null);
            });
        }
    
        function encodeField(boundary, name, value) {
            var buffer = '--' + boundary + '\r\n';
            buffer += 'Content-Disposition: form-data; name="' + name + '"\r\n\r\n';
            buffer += value + '\r\n';
            return buffer;
        }
    
        function encodeFile(boundary, type, name, filename) {
            var buffer = "--" + boundary + "\r\n";
            buffer += 'Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\r\n';
            buffer += 'Content-Type: ' + type + '\r\n\r\n';
            return buffer;
        }
        
        return  {
            "setVerbose"       : setVerbose,
            "setAPIKey"        : setAPIKey,
            "setApplication"   : setApplication,
            "setEvent"         : setEvent,
            "setPriority"      : setPriority,
            "post"             : post
        };
    };

exports.prowl = prowl;
