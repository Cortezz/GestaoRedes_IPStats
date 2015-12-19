var plotly = require("plotly")('JCortez','05vfc825fj');
var snmp = require('snmp-native');
var session = new snmp.Session();
var dateFormat = require('dateformat');

var tokens = ["f63kaewu22","0l8jbuq5o5"];

//Received IP Datagrams data to be streamed
var rec = {
    'x':[],
    'y':[],
     type:'scatter',
     mode:'lines+markers',
     name: 'IP Datagrams received',
    stream: {
      token: 'f63kaewu22',
      maxpoints: 6
  }
};

//Sent IP Datagrams data to be streamed
var sent = {
    'x':[],
    'y':[],
     type:'scatter',
     mode:'lines+markers',
     name: 'IP Datagrams sent',
    stream: {
      token: '0l8jbuq5o5',
      maxpoints: 6
  }
};

var datagrams = [rec, sent];


//Graph's Layout
var layout = {
      xaxis: {
        title: ("Time (sec)")
      }, 
      yaxis: {
        title: ("Number of packets")
      },
      showlegend: true,
      margin: {
        l: 100,
     }
};


var graphOptions = {layout: layout, filename: 'date-axes', fileopt : 'overwrite', filename : 'IP Stats'};
var beginning = Date.now();

              //SystemUpTime     &   IpInReceives     &   IpInDelivers
var oids = [[1,3,6,1,2,1,25,1,1,0],[1,3,6,1,2,1,4,3,0],[1,3,6,1,2,1,4,9,0]];

              //ipSystemStatsInReceives &   ipSystemStatsInDelivers     --> Not working. 
var oidsNew = [[1,3,6,1,2,1,4,31,1,1,3,0],[1,3,6,1,2,1,4,31,1,1,18,0]];






plotly.plot(datagrams, graphOptions, function (err, msg) {
    if (err) return console.log(err);
    console.log(msg);

    var stream1 = plotly.stream('f63kaewu22', function (err, res) {
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });

    var stream2 = plotly.stream("0l8jbuq5o5", function (err, res){
        if (err) return console.log(err);
        console.log(res);
        clearInterval(loop); // once stream is closed, stop writing
    });

    

    var loop = setInterval(function () {
      session.getAll({ oids: oids }, function (error, varbinds) {
        if (error) {
            console.log('Fail :(');
        } else {
          //Number of packets
          var packetsReceived = varbinds[1].value;
          var packetsSent = varbinds[2].value;
          //raw timestamps
          var timestampReceived = new Date(varbinds[1].receiveStamp);
          var timestampSent = new Date(varbinds[2].receiveStamp);
          //Formatted timestamps;
          var formattedTimestampReceived = dateFormat(new Date(timestampReceived),"yyyy-dd-mm HH:MM:ss");
          var formattedTimestampSent = dateFormat(new Date(timestampSent),"yyyy-dd-mm HH:MM:ss");
          //Prepare the data and stream it
          var data = { x : formattedTimestampReceived, y : (packetsReceived/1000000) };
          var data2 = { x : formattedTimestampSent, y : (packetsSent/1000000) };
          var streamObject = JSON.stringify(data);
          var streamObject2 = JSON.stringify(data2);
          stream2.write(streamObject2+'\n');
          stream1.write(streamObject+'\n');
        }
      });
        
    }, 11000);
});
