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
     name: 'IP Datagrams received/min',
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
     name: 'IP Datagrams sent/min',
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
        title: ("Packets/Min")
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




var packetsReceived, packetsSent;


plotly.plot(datagrams, graphOptions, function (err, msg) {
    var i = 0;
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
          console.log(i);
          var timestampReceived, timestampSent, formattedTimestampSent, formattedTimestampReceived;
          if (i!=0){
            var pcktsPerMin = calculatePacketsPerMin(packetsReceived, varbinds[1].value, packetsSent, varbinds[2].value,11);
          }
          //Number of packets
          packetsReceived = varbinds[1].value;
          packetsSent = varbinds[2].value;
          //raw timestamps
          timestampReceived = new Date(varbinds[1].receiveStamp);
          timestampSent = new Date(varbinds[2].receiveStamp);
          //Formatted timestamps;
          formattedTimestampReceived = dateFormat(new Date(timestampReceived),"yyyy-dd-mm HH:MM:ss");
          formattedTimestampSent = dateFormat(new Date(timestampSent),"yyyy-dd-mm HH:MM:ss");
          //Prepare the data and stream it
          if (i!=0){
            var data = { x : formattedTimestampReceived, y : pcktsPerMin[0] };
            var data2 = { x : formattedTimestampSent, y : pcktsPerMin[1] };
            var streamObject = JSON.stringify(data);
            var streamObject2 = JSON.stringify(data2);
            stream2.write(streamObject2+'\n');
            stream1.write(streamObject+'\n');
          }
          i++;
        }
      });
        
    }, 12000);
});


function calculatePacketsPerMin (received, receivedNew, sent, sentNew, interval){
  var pcktRcv, pcktSent;
  pcktRcv = receivedNew - received;
  pcktSent = sentNew - sent;

  var packetsPerMin = new Object(); 
  packetsPerMin[0] = Math.round((60*pcktRcv)/interval);
  packetsPerMin[1] = Math.round((60*pcktSent)/interval);

  return packetsPerMin;

}
