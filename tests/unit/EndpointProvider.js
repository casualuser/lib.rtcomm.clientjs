/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
define([
    'intern!object',
    'intern/chai!assert',
    'intern/node_modules/dojo/Deferred',
    (typeof window === 'undefined' && global)
      ?'intern/dojo/node!../support/mqttws31_shim':
        'lib/mqttws31',
    'support/config',
    'ibm/rtcomm'
], function (registerSuite, assert, Deferred, globals,config, rtcomm) {
  var badconfig = {
      server: 1,
      port: "a",
      userid: 1,
      connectorTopicName: {}
  };
  var validconfig = { server: "a",
      port: 1883,
      userid: "someuser",
      connectorTopicName: "sometopic"};

  var endpointProvider = null;
  registerSuite({
    name: "Unit Tests - EndpointProvider",
    beforeEach: function() {
     console.log('******** Running Test *********');
     endpointProvider && endpointProvider.destroy();
     endpointProvider = new rtcomm.RtcommEndpointProvider();
    },
    "empty config for init()": function() {
        var error = null;
        try {
          console.log('INITIALIZING PROVIDER');
          endpointProvider.init();
        } catch(e) {
          error = e;
          console.log(error);
        }
        assert.equal('EndpointProvider initialization requires a minimum configuration: {"server":"string","port":"number"}', error.message);
      },
      "valid but incorrect config throws an error": function(){
            var error = null;
            try {
              endpointProvider.init(validconfig);
            } catch(e) {
              error = e;
              console.log(error);
            }
            assert.ok(error);
       },
       "getRtcommEndpoint() [no args, no appContext set] throws error": function(){
            var error = null;
            try {
              var rtc = endpointProvider.getRtcommEndpoint();
            }  catch(e) {
              console.log(e);
              error = e;
            }
            assert.ok(error);
            assert.ok(Object.keys(endpointProvider.endpoints()).length === 0);
            console.log(endpointProvider.currentState());
        },
        "getRtcommEndpoint() [no args]returns valid object": function(){
            var error = null;
            var endpoint = null;
            try {
              endpointProvider.setAppContext('test');
              endpoint = endpointProvider.getRtcommEndpoint();
            }  catch(e) {
              console.log(e);
              error = e;
            }
            console.log('TEST endpoint: ', endpoint);
            assert.ok(endpoint);
            console.log('TEST endpoint.appContext: '+ endpoint.getAppContext());
            assert.ok(endpoint.getAppContext() === 'test');
            console.log('TEST endpoint.userid: '+ endpoint.getUserID());
            console.log('TEST endpointProvider.userid: '+ endpointProvider.getUserID());
            assert.ok(endpoint.getUserID() === endpointProvider.getUserID());
            assert.notOk(error);
            assert.ok(Object.keys(endpointProvider.endpoints()).length === 1);
            console.log(endpointProvider.currentState());
        },
        "getRtcommEndpoint() [args]returns valid object": function(){
            var error = null;
            var endpoint = null;
            try {
              endpointProvider.setAppContext('test');
              endpoint = endpointProvider.getRtcommEndpoint({chat: true, webrtc: true});
            }  catch(e) {
              console.log(e);
              error = e;
            }
            console.log('TEST endpoint: ', endpoint);
            assert.ok(endpoint);
            console.log('TEST endpoint.appContext: '+ endpoint.getAppContext());
            assert.ok(endpoint.getAppContext() === 'test');
            console.log('TEST endpoint.userid: '+ endpoint.getUserID());
            console.log('TEST endpointProvider.userid: '+ endpointProvider.getUserID());
            assert.ok(endpoint.getUserID() === endpointProvider.getUserID());
            assert.ok(typeof endpoint.getUserID() === 'undefined');
            assert.notOk(error);
            assert.ok(Object.keys(endpointProvider.endpoints()).length === 1);
            console.log(endpointProvider.currentState());
        },
        "getRtcommEndpoint() - Multiples w/ same config return different objects.": function(){
            var error = null;
            var endpoint = null;
            var endpoint2 = null;
            try {
              endpointProvider.setAppContext('test');
              endpoint = endpointProvider.getRtcommEndpoint();
              endpoint2 = endpointProvider.getRtcommEndpoint();
            }  catch(e) {
              console.log(e);
              error = e;
            }
            assert.ok(endpoint !== endpoint2);
            assert.notOk(error);
            assert.ok(Object.keys(endpointProvider.endpoints()).length === 2);
            console.log(endpointProvider.currentState());
          },
          "getRtcommEndpoint() - API Validation": function(){
            // This needs to be moved to an RtcomMEndpoint unit test rather than here I think.
            this.skip();
            var fakeBadSelfView = {};
            var fakeBadRemoteView = {};
            var fakeSelfView = {src: ""};
            var fakeRemoteView = {src: ""};
            var error = null;
            endpointProvider.setAppContext('test');
            var rtc = endpointProvider.getRtcommEndpoint({webrtc:true, chat: true});
            console.log('MediaIn throws a TypeError without .src');
            try {
              rtc.setMediaIn(fakeBadRemoteView);
            } catch(e) {
              error = e;
            }
            assert.ok(error instanceof TypeError);
            console.log('MediaOut throws a TypeError without .src');

            error = null;
            try {
              rtc.setMediaOut(fakeBadSelfView);
            } catch(e) {
             error = e;
            }
            assert.ok(error instanceof TypeError);

            error = null;
            console.log('MediaIn does not throw error w/ .src', error);
            try {
              rtc.setMediaIn(fakeRemoteView);
            } catch(e) {
              console.log('Threw an error, ', e, fakeRemoteView);
             error = e;
            }
            // error should be null;
            assert.notOk(error);
            error = null;

            console.log('MediaOut does not throw error w/ .src');
            try {
              rtc.setMediaOut(fakeSelfView);
            } catch(e) {
              error = e;
            }
            // error should be null;
            assert.notOk(error);
            assert.ok(rtc);
          },
        "getRtcommEndpoint() - call webrtc.enable on it... ": function(){
            var error = null;
            try {
              endpointProvider.setAppContext('test');
              var rtc = endpointProvider.getRtcommEndpoint({webrtc: true, chat: true});
              rtc.webrtc.enable();
            }  catch(e) {
              error = e;
            }
            assert.ok(rtc);

            if (typeof global !== 'undefined') {
              // Probably node.js... expect an error
              assert.ok(error);
            } else { 
            // browser
            assert.notOk(error);
            }
            
          },
        "logLevel": function(){
            var error = null;
            try {
              endpointProvider.setLogLevel('thing');
            } catch (e)  {
              error = e;
            }
            assert.ok(error);

            var lvl = 'MESSAGE';
            console.log('MESSAGE', lvl);
            endpointProvider.setLogLevel(lvl);
            assert.equal(lvl, endpointProvider.getLogLevel());

            lvl = 'DEBUG';
            endpointProvider.setLogLevel(lvl);
            assert.equal(lvl, endpointProvider.getLogLevel());

            lvl = 'INFO';
            endpointProvider.setLogLevel(lvl);
            assert.equal(lvl, endpointProvider.getLogLevel());

            lvl = 'TRACE';
            endpointProvider.setLogLevel(lvl);
            assert.equal(lvl, endpointProvider.getLogLevel());

          }
  }); // End of Tests


});
