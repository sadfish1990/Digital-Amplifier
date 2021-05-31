const volume = document.getElementById('volume')
const bass = document.getElementById('bass')
const mid = document.getElementById('mid')
const treble = document.getElementById('treble')
const visualizer = document.getElementById('visualizer')
const impulso = document.getElementById('impulso')



const context = new AudioContext()
var gain = context.createGain(context, { gain: volume.value});
var convolver = context.createConvolver();
var convolverGain = context.createGain(context, { gain: impulso.value});
var master = context.createGain();
var masterCompression = context.createDynamicsCompressor();

const analyserNode = new AnalyserNode(context, { fftSize: 256 })
const gainNode = new GainNode(context, { gain: volume.value})
const bassEQ = new BiquadFilterNode(context, {
  type: 'lowshelf',
  frequency: 500,
  gain: bass.value
})
const midEQ = new BiquadFilterNode(context, {
  type: 'peaking',
  Q: Math.SQRT1_2,
  frequency: 1500,
  gain: mid.value
})
const trebleEQ = new BiquadFilterNode(context, {
  type: 'highshelf',
  frequency: 3000,
  gain: treble.value
})

setupEventListeners()
setupContext()
resize()
drawVisualizer()

function setupEventListeners() {
  window.addEventListener('resize', resize)

  volume.addEventListener('input', e => {
    const value = parseFloat(e.target.value)
    gainNode.gain.setTargetAtTime(value, context.currentTime, .01)
  })

  bass.addEventListener('input', e => {
    const value = parseInt(e.target.value)
    bassEQ.gain.setTargetAtTime(value, context.currentTime, .01)
  })

  mid.addEventListener('input', e => {
    const value = parseInt(e.target.value)
    midEQ.gain.setTargetAtTime(value, context.currentTime, .01)
  })

  treble.addEventListener('input', e => {
    const value = parseInt(e.target.value)
    trebleEQ.gain.setTargetAtTime(value, context.currentTime, .01)
  })


  impulso.addEventListener('input', e => {
    const value = parseFloat(e.target.value)
    convolverGain.gain.setTargetAtTime(value, context.currentTime, .01)
  })

  impulso.addEventListener('input', e => {
    const value = parseFloat(e.target.value)
    convolverGain.gain.setTargetAtTime(value, context.currentTime, .01)
  })


}

async function setupContext() {
  const guitar = await getGuitar()
  if (context.state === 'suspended') {
    await context.resume()
  }

  const source = context.createMediaStreamSource(guitar)
    source

    .connect(bassEQ)
    .connect(midEQ)
    .connect(trebleEQ)
    .connect(gainNode)
    .connect(analyserNode)
    .connect(context.destination)
  
 }

function getGuitar() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      latency: 0
    }
  })
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer)

  const bufferLength = analyserNode.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyserNode.getByteFrequencyData(dataArray)
  const width = visualizer.width
  const height = visualizer.height
  const barWidth = width / bufferLength

  const canvasContext = visualizer.getContext('2d')
  canvasContext.clearRect(0, 0, width, height)

  dataArray.forEach((item, index) => {
    const y = item / 255 * height / 2
    const x = barWidth * index

    canvasContext.fillStyle = `hsl(${y / height * 400}, 100%, 50%)`
    canvasContext.fillRect(x, height - y, barWidth, y)
  })
}

function resize() {
  visualizer.width = visualizer.clientWidth * window.devicePixelRatio
  visualizer.height = visualizer.clientHeight * window.devicePixelRatio
}






var loadImpulse = function ( fileName )
{   var impulsoUrl = "http://127.0.0.1:5500/Digital-Amplifier-main/index.html" + fileName;
    ajaxRequest = new XMLHttpRequest();
    ajaxRequest.open('GET', impulsoUrl, true);
    ajaxRequest.responseType = 'arraybuffer';
  
    ajaxRequest.onload = function() {
      var impulseData = ajaxRequest.response;
  
      context.decodeAudioData(impulseData, function(buffer) {
        myImpulseBuffer = context.createBufferSource();
          myImpulseBuffer = buffer;
          convolver.buffer = myImpulseBuffer;
          convolver.loop = false;
          convolver.normalize = true;
          convolverGain.gain.value = 0;
          convolverGain.connect(convolver);
          convolver.connect(master);
          master.connect(masterCompression);
          masterCompression.connect(context.destination)
        },
   
         
        function(e){"Error with decoding audio data" + e.err});


    }
  
    ajaxRequest.send();

}

loadImpulse(document.getElementById('impulse').value);



if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');
    navigator.getUserMedia (

      {
          audio: true,
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          latency: 0
       },
 
      
       function(stream) {
          source = context.createMediaStreamSource(stream);
          source.connect(gainNode)
          source.connect(convolverGain);
          source.connect(master);
          master.connect(masterCompression);
          masterCompression.connect(context.destination);

            
        },
 
       
       function(err) {
          console.log('The following gUM error occured: ' + err);
       }
    );
 } else {
    console.log('getUserMedia not supported on your browser!');
 }




