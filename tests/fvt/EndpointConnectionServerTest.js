define(["doh/runner","tests/common/config","ibm/rtcomm/connection"], function(doh,config, connection){

    dojo.require("lib/mqttws31");
  
    var config1 = config.clientConfig1();
   // config1.serviceTopic= "/WebRTC";

    // client2 Config
    var config2 = config.clientConfig2();
 //   config2.serviceTopic= "/WebRTC";

    var T1 = 2000;  // How long we wait to setup, before sending messages.
    var T2 = T1 + 2000; // How long we wait to check results
    var T3 = T2 +2000;  // How long we wait to timeout test.
    var T4 = T3 +2000;
    var T5 = T4 +2000;
    // serviceTopic Config
    var serviceTopic = new config._ServerConfig("servicetopic@ibm.com","/WebRTC");
    serviceTopic.myTopic = "/WebRTC";

    var p2pFixture = function(name, /*boolean*/ direct, /*function*/ runTest, /*integer*/ timeout) {
      return {
        name : "P2P " + name,
        setUp: function() {
          /*
           * This creates TWO EndpointProvider objects that
           * we connect together by swapping their ServiceTopics
           * 
           * There is no liberty RTCOMM Signaling Node on the back end expected.
           * 
           * if 'direct' = true, then we will create it to each other.
           * 
           */
          console.log('setup of p2pFixture called');
          var test = this;
          this.direct = direct;
          
          if (!direct) {
            config1.register=false;
            config2.register=false;
            config1.createEndpoint=false;
            config2.createEndpoint=false;
          } 
          
          /*
           * Client1 
           */
          console.log("*** Creating EndpointProvider1 ***", config1);
         
          this.conn1 = new connection.EndpointConnection(config1);
          this.conn1.connect(/*onSuccess*/ function(service) {
            console.log("Connection 1 initialized "+ service.id);
            // If we get an rtcommEndpoint back, assign it.  
            test.conn1.register();
          }.bind(this),
          function(error) {
            console.log(error);
          }
          );
          console.log('1 logLevel:', this.conn1.getLogLevel());
          /*
           * Client2
           */
          console.log("*** Creating EndpointProvider2 ***", config2);
          this.conn2 =new connection.EndpointConnection(config2);
          this.conn2.connect( /*onSuccess*/ function(service) {
            console.log("Connection 2 initialized: "+ service.id);
            // If we get an rtcommEndpoint back, assign it.  
            this.conn2.register();
          }.bind(this),
          function(error) {
            console.log(error);
          });
          console.log('2 logLevel:', this.conn2.getLogLevel());
        },
        runTest: runTest,
        tearDown: function() {
          this.conn1.disconnect();
          this.conn2.disconnect();
        },
        timeout: timeout
      };
    };
    
    doh.register("EndpointConnectionTest - using Server", [
      function assertTrueTest(){
        doh.assertTrue(true);
        doh.assertTrue(1);
        doh.assertTrue(!false);
      },
      
      { name: "Connection Test",
        runTest: function() {
          var nc = new connection.EndpointConnection(config1);
        
          var success = false;
          nc.connect( function() {
            console.log('CONNECT SUCCESS!');
            success = true;
          }, 
          function() {
            console.log('CONNECT FAILURE!');
            success = false;
          })
          var def = new doh.Deferred();
          setTimeout(def.getTestCallback(function() {
            console.log('nc.ready', nc.ready);
            console.log(nc);
            doh.t(success);
            nc.disconnect();
          }),
          T1)
          return def;
        },
        timeout: T3
      },
      { name: "Register Test",
        runTest: function() {
          var nc = new connection.EndpointConnection(config1);
          
          var success = false;
          var register = false;
          nc.connect(function() {
            console.log('CONNECT SUCCESS!');
            nc.register();
            success = true;
          }, 
          function() {
            console.log('CONNECT FAILURE!');
            success = false;
          })
          var def = new doh.Deferred();
          setTimeout(def.getTestCallback(function() {
            console.log('nc.ready', nc.ready);
            console.log(nc);
            doh.t(success);
            doh.t(nc.registered);
            nc.disconnect();
          }),
          T1)
          return def;
        },
        timeout: T3
      },
      { name: "Service Query Test",
        runTest: function() {
          var nc = new connection.EndpointConnection(config1);
          var success = false;
          var register = false;
          nc.connect(function() {
            console.log('CONNECT SUCCESS!');
            nc.service_query(function(info){
              console.log('Service_QuerySuccess: ',info);
              success = true;
            }, function(error){
              console.error(error);
            });
          }, 
          function() {
            console.log('CONNECT FAILURE!');
            success = false;
          })
          var def = new doh.Deferred();
          setTimeout(def.getTestCallback(function() {
            console.log('nc.ready', nc.ready);
            console.log(nc);
            doh.t(success);
            nc.disconnect();
          }),
          T1)
          return def;
        },
        timeout: T3
      },
      
      
     
      new p2pFixture('Initiate Connections', true, 
          function() {
            var self = this;
          // kind of working... let's see what happens tonight.  
            this.conn1.setLogLevel('MESSAGE');
            var ll1 = this.conn1.getLogLevel();
            this.conn2.setLogLevel('DEBUG');
            var ll2 = this.conn2.getLogLevel();
            console.log('ll1: '+ll1+ ' ll2: '+ll2);
            var def = new doh.Deferred();
            setTimeout(def.getTestCallback(function(){
              console.log('conn1 ready? ', self.conn1.ready);
              console.log('conn2 ready? ', self.conn2.ready);
              doh.t(self.conn1.ready);
              doh.t(self.conn2.ready);
              doh.t(self.conn1.registered);
              doh.t(self.conn2.registered);
            }), T2);
            return def;
          },
          T3
      ),
      new p2pFixture('Start Session test...', true, 
          function() {
        console.log('******* Running Test ***********');
        var sess1 = null;
        var test = this;
        var sess2 = null;
        
        this.conn2.on('newsession', function(session) {
          // A new inbound session was created!  send a pranswer!
         console.log('P2P TEST: Inbound Session created -->', session);
         // get a pranswer -- we don't really use one, so doesn't matter.
         session.start();
         console.log('Transactions:', test.conn2.transactions.list());
         session.pranswer();
         // this would be a manual click...
         console.log('started session... ', session);
         sess2 = session;
        });
        
        
        var def = new doh.Deferred();

        // After T1, start the session. ensures everything is ready.
        setTimeout(function() {
          doh.t(test.conn1.ready);
          doh.t(test.conn2.ready);
          sess1 = test.conn1.createSession();
          console.log('session' ,sess1);
          console.log('config2.userid', config2.userid);
          console.log('Starting session');
          sess1.start({toEndpointID: config2.userid});
        },T1);
        
        setTimeout(function(){
           // Send an Answer...
          console.log('Conn1 Transactions:', test.conn1.transactions.list());
          console.log('Conn2 Transactions:', test.conn2.transactions.list());
          doh.t(sess2);
          sess2.respond({type: 'answer', sdp:''});
        },T2);
        setTimeout(function(){
          console.log('Session1', sess1);
          console.log('Session2', sess2);
          doh.assertEqual('started', sess1.state);
          doh.assertEqual('started', sess2.state);
          sess1.stop();
        },T3);
        setTimeout(def.getTestCallback(function(){
          console.log('Session1', sess1);
          console.log('Session2', sess2);
          doh.assertEqual('stopped', sess1.state);
          doh.assertEqual('stopped', sess2.state);
        }),
        T4);
        return def;

      },
      T5
      )

    ]);
});