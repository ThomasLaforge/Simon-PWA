import { useCallback, useEffect, useState } from 'react'
import './App.css'

const RESTART_DELAY = 1000
const SHOW_TIME = 1000
const PAUSE_TIME = 500

type SimonButtonValue = 'yellow' | 'green' | 'red' | 'blue'
const SIMON_BUTTONS: SimonButtonValue[] = [
  'yellow', 'green', 'red', 'blue'
]
const grammar = `#JSGF V1.0; grammar colors; public <color> = ${SIMON_BUTTONS.join(' | ')};`

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// @ts-ignore
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);

recognition.grammars = speechRecognitionList;
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onspeechend = () => {
  recognition.stop();
}

const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * SIMON_BUTTONS.length)
  return SIMON_BUTTONS[randomIndex]
}

function App() {
  const [isIaToPlay, setIsIaToPlay] = useState<boolean>(true);
  const [sequence, setSequence] = useState<SimonButtonValue[]>([getRandomColor()]);
  const [step, setStep] = useState<number>(0);
  const [pause, setPause] = useState(false);

  // Voice recognition
  useEffect(() => {
    recognition.onresult = (event: any) => {
      const color: any = event.results[0][0].transcript;
      console.log('color', color)
      if(!isIaToPlay){
        if(SIMON_BUTTONS.includes(color)){
          if(color === sequence[step]){
            setStep(step + 1)
          }
          else {
            setStep(-1)
          }
        }
      }
      console.log(`Confidence: ${event.results[0][0].confidence} Color: ${color}`);
    }
  }, [isIaToPlay, step, sequence])

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if(step === sequence.length) {
      if(!isIaToPlay){
        setSequence([...sequence, getRandomColor()])
      }
      setStep(0);
      setIsIaToPlay(!isIaToPlay);
    }
    return () => timer && clearTimeout(timer)
  }, [step, isIaToPlay, sequence]);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    let waitTimer: NodeJS.Timeout;
    if(isIaToPlay) {
      setPause(true)
      waitTimer = setTimeout(() => { 
        setPause(false)
        timer = setTimeout(() => {
          setStep(step + 1);
        }, SHOW_TIME);
      }, PAUSE_TIME)
    }
    return () => {
      timer && clearTimeout(timer)
      waitTimer && clearTimeout(waitTimer)
    };
  }, [step, isIaToPlay]);

  const handleClickSimonButton = useCallback((color: SimonButtonValue) => {
    if(!isIaToPlay){
      if(sequence[step] === color){
        setStep(step + 1)
      }
      else {
        setStep(-1)
        if(Notification.permission === "granted"){
          const notification = new Notification("Game is over !  You scored " + (sequence.length - 1));
        }
        else {
          Notification.requestPermission()
            .then((permission) => {
              // If the user accepts, let's create a notification
              if (permission === "granted") {
                const notification = new Notification("Game is over !  You scored " + (sequence.length - 1))
              }    
          })
        }
      }
    }      
  }, [isIaToPlay, step, sequence]);

  const handleRestart = useCallback(() => {
    const timer = setTimeout(() => {
      setStep(0)
      setSequence([getRandomColor()])
      setIsIaToPlay(true)
    }, RESTART_DELAY)
    return () => clearTimeout(timer)
  }, [])

  const handleVoiceCommand = useCallback(() => {
    recognition.start();
  }, [])

  return (
    <div className="container">
      <div className="wrapper-simon">
        {SIMON_BUTTONS.map((color: SimonButtonValue, key: number) => {
          const shine = (isIaToPlay && !pause && sequence && sequence[step] === color) ? 'shine' : '';
          return (
            <button 
              className={`simon-button ${color} ${shine}`} 
              onClick={() => handleClickSimonButton(color)}
              key={key}
            >
            </button>
          )
        })}
      </div>
      <button onClick={handleVoiceCommand}>Voice command</button>
      <div>SCORE : {sequence.length - 1}</div>
      {step === -1 && <div>You lost ! <button onClick={handleRestart}>Restart</button></div>}
    </div>
  )
}

export default App
